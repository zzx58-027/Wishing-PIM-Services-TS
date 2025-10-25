import { StorageValue, Storage } from "unstorage";
import {
  ProductSpecModel,
  type TObjectRecordType,
  type PooleFTP_RawFile,
} from "./model";

const pooleFTP_Config = {
  userToken_KV_Path: "/services/poole-ftp/user_token",
  allFilesList_KV_Path: "_system/poole/poole-ftp/filesList.json",
  filesChangeLog_KV_Path: "_system/poole/poole-ftp/changelog.json",
  baseURL: "https://poolelighting.ftpstream.com/api/1.0/",
  endpoints: {
    getUserToken: "session/login",
    getFilesList: "files/list",
    getFilesDownloadUrl: "files/download",
  },
};

type Service_FileType = (PooleFTP_RawFile & {
  doc_full_path: string;
  doc_type: string;
})[];

export abstract class PooleFTPService {
  static productSpecModel: TObjectRecordType = ProductSpecModel;

  static async getUserToken() {
    const { session_id: userToken } = await fetch(
      pooleFTP_Config.baseURL + pooleFTP_Config.endpoints.getUserToken,
      {
        headers: {
          Authorization: `Basic ${process.env.POOLE_FTP_LOGIN_BASIC_AUTH}`,
        },
      }
    ).then<{ session_id: string }>((resp) => resp.json());
    return userToken;
  }

  static async getFilesList(path: string) {
    const userToken = await PooleFTPService.getUserToken();

    const result = await fetch(
      pooleFTP_Config.baseURL + pooleFTP_Config.endpoints.getFilesList,
      {
        method: "POST",
        headers: {
          // 必须设置 Content-Type 为 application/json
          "Content-Type": "application/json",
          Cookie: `token=${userToken}`,
        },
        body: JSON.stringify({
          path,
        }),
      }
    ).then<{ files: PooleFTP_RawFile[] }>((resp) => resp.json());
    return result.files.map((file) => ({
      ...file,
      // 如果 path 是空字符串 ""，split("/") 会返回 [""]，.at(-1) 将取到 ""，最终结果为 doc_type: "" || "/"（即 "/"）。
      doc_type: path.split("/").slice(-1)[0] || "/",
      // 如果传入的 path 多了末尾 /, 会在这里造成一定错误.
      doc_full_path: path === "/" ? `/${file.name}` : `${path}/${file.name}`,
    }));
  }

  //
  //
  /**
   *
   * @param files
   * @example /NEXT/Spec/Next DI E70788.pdf
   * @example /ENDON/Specs/Endon 101181.pdf
   * @description 有毒啊这妈了个巴子的. 好像需要用创建 download 链接时使用的 Token 来进行文件下载才行.
   */
  static async downloadFiles(files: string[]) {
    const userToken = await PooleFTPService.getUserToken();
    const result = await fetch(
      pooleFTP_Config.baseURL + pooleFTP_Config.endpoints.getFilesDownloadUrl,
      {
        method: "POST",
        headers: {
          // 必须设置 Content-Type 为 application/json
          "Content-Type": "application/json",
          Cookie: `token=${userToken}`,
        },
        body: JSON.stringify({
          files,
        }),
      }
    ).then<{ link: string }>((resp) => resp.json());
    return await fetch(result.link, {
      headers: {
        Cookie: `token=${userToken}`,
      },
    });
  }

  static async getAllFilesByPath(
    r2_main: Storage<StorageValue>,
    path = "/",
    refresh = false
  ): Promise<Service_FileType> {
    if (refresh === false && path === "/") {
      const result = await r2_main.getItem(
        pooleFTP_Config.allFilesList_KV_Path
      );
      return result as any;
    }

    // 从根路径开始, 遍历获取所有文件, 文件夹的 type 为 d, 文件为 f
    const items = await this.getFilesList(path);
    let result = [];
    const files = items.filter((item) => item.type === "f");
    result.push(...files);
    const folders = items.filter((file) => file.type === "d");
    for (const folder of folders) {
      const subFiles = await this.getAllFilesByPath(
        r2_main,
        folder.doc_full_path
      );
      result.push(...subFiles);
    }

    // 更新/缓存结果于 R2_Main, 供下游方法使用.
    // put(
    //   "_system/poole/poole-ftp/filesList.json",
    //   JSON.stringify(result, null, 2)
    // );
    if (path === "/") {
      await r2_main.setItem(
        pooleFTP_Config.allFilesList_KV_Path,
        JSON.stringify(result, null, 2)
      );
    }

    return result;
  }

  /**
   *
   * @param qyeryArr
   * @example ["73999", "70180332", "Carmine"]
   */
  static async findRelatedFiles(
    r2_main: Storage<StorageValue>,
    queryArr: string[]
  ) {
    const filesList =
      ((await r2_main.getItem(pooleFTP_Config.allFilesList_KV_Path)) as Awaited<
        ReturnType<typeof PooleFTPService.getAllFilesByPath>
      >) ?? (await this.getAllFilesByPath(r2_main, "/"));

    return filesList.filter((file) =>
      queryArr.some((q) => file.name.includes(q))
    );
  }

  static async getChangedFilesList(r2_main: Storage<StorageValue>) {
    return (
      (await r2_main.getItem(pooleFTP_Config.filesChangeLog_KV_Path)) ?? []
    );
  }

  static async _scheduledTask(r2_main: Storage<StorageValue>) {
    const oldFiles =
      ((await r2_main.get(
        pooleFTP_Config.allFilesList_KV_Path
      )) as Service_FileType) ?? [];
    const newFiles = await this.getAllFilesByPath(r2_main, "/", true);
    const fileChanges = this._computeFileChanges(oldFiles, newFiles);

    await r2_main.setItem(
      pooleFTP_Config.filesChangeLog_KV_Path,
      JSON.stringify(fileChanges, null, 2)
    );

    return fileChanges;
  }

  private static _computeFileChanges = (
    oldFiles: Service_FileType,
    newFiles: Service_FileType
  ) => {
    const changes: Record<"deleted" | "modified" | "added", any[]> = {
      deleted: [],
      modified: [],
      added: [],
    };
    const changesOutputTransformer = (_changes: typeof changes) => {
      return Object.entries(_changes).flatMap(([type, files]) =>
        files.map((file) => ({
          ...file,
          change_meta_type: type,
          change_meta_time: new Date().toISOString(),
        }))
      );
    };

    if (oldFiles.length === 0) {
      changes.added = newFiles;
      return changesOutputTransformer(changes);
    }

    // 1. 构建旧文件的哈希表 (Map) 以实现 O(1) 查找
    // Key: doc_full_path, Value: 文件对象本身
    const oldFilesMap = new Map();
    for (const file of oldFiles) {
      // 使用 doc_full_path 作为唯一键
      oldFilesMap.set(file.doc_full_path, file);
    }

    // 2. 遍历新文件列表，识别新增和修改
    for (const newFile of newFiles) {
      const path = newFile.doc_full_path;

      if (oldFilesMap.has(path)) {
        // 文件存在于旧列表中：可能是修改或未变
        const oldFile = oldFilesMap.get(path);

        // 移除旧文件哈希表中的对应项，剩下的就是被删除的
        oldFilesMap.delete(path);

        // 比较 size 或 time，如果不同则判定为修改
        if (newFile.size !== oldFile.size || newFile.time !== oldFile.time) {
          changes.modified.push({
            path: path,
            old: oldFile,
            new: newFile,
          });
        }
        // 否则：未变动，不做任何操作
      } else {
        // 文件不存在于旧列表中：判定为新增
        changes.added.push(newFile);
      }
    }

    // 3. 遍历旧文件哈希表中剩余的项，识别删除
    // 在步骤 2 中，每处理一个找到的旧文件，就将其从 oldFilesMap 中删除。
    // 循环结束后，Map 中剩下的就是新列表中不存在的文件，即被删除的文件。
    for (const [path, file] of oldFilesMap) {
      changes.deleted.push(file);
    }

    // return changes;
    return Object.entries(changes).flatMap(([type, files]) =>
      files.map((file) => ({
        ...file,
        change_meta_type: type,
        change_meta_time: new Date().toISOString(),
      }))
    );
  };
}

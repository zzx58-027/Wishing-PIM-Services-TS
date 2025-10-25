import { t } from "elysia";

export const PooleFTP_Models = {
  rawFile: t.Object({
    type: t.String(), // file (f) / folder (d)
    name: t.String(),
    size: t.Number(),
    time: t.Number(),
    perm: t.Number(),
    owner: t.Number(),
  }),
  reqPayloads: {
    getFilesDownloadUrlPayload: t.Object({
      filePaths: t.Array(t.String()),
    }),
    findRelatedFilesPayload: t.Object({
      queryArr: t.Array(t.String()),
    }),
    parseProductSpecPayload: t.Object({
      file: t.File(),
    }),
  },
};

export type PooleFTP_RawFile = typeof PooleFTP_Models.rawFile.static;

// 产品标签成员描述模型
export const ProductSpecLabelDocItemModel = t.Object({
  labelName: t.String({
    description: "Like: Wattage, Product Rating Label(PRL), SM3, SM4",
  }),
  labelDimension: t.String({
    description: "Format: W100xH100mm",
  }),
  labelPosition: t.String({
    description: "Like: Wrap neatly around cable near plug",
  }),
  labelMaterial: t.String({
    description:
      "Like: Print black on clear | Print black text on white, etc...",
  }),
});

// 零售包装模型
export const RetailCartonModel = t.Object({
  quantity: t.Number({
    description: "How many items in this type of carton.",
  }),
  dimensions: t.String({
    description: "Format: W100xD100xH100mm, should convert cm to mm.",
  }),
  grossWeight: t.String(),
  cartonType: t.String({
    description:
      "Format: ${Carton Colour Type: Brown | Colour} Box - ${Carton Type: Crash Lock Carton | Brown Flap Carton} like: Colour Box - Crash Lock Carton",
  }),
  packageWay: t.String({
    description:
      "like: Retail carton is Brown carton - B&W print - B&W ean label with JLP - Full Unbranded customer brand artwork, Flap carton",
  }),
});

// 运输包装模型
export const ShipmentCartonModel = t.Object({
  quantity: t.Number({
    description: "How many items in this type of carton.",
  }),
  dimensions: t.String({
    description: "Format: W100xD100xH100mm, should convert cm to mm.",
  }),
  grossWeight: t.String(),
  cartonType: t.String({
    description:
      "Format: ${Carton Colour Type: for shipment carton, usually it's brown box} Box - ${Carton Type: Crash Lock Carton | Brown Flap Carton} like: Brown Box - Flap Carton",
    default: "Brown box.",
  }),
  packageWay: t.String({
    description:
      "like: Shipment carton is Brown carton - B&W print - B&W ean label with Endon - Full Unbranded customer brand artwork, Flap carton",
  }),
});

// 产品包装模型
export const ProductPackagingModel = t.Object({
  retailCarton: RetailCartonModel,
  shipmentCarton: ShipmentCartonModel,
});

// 其他产品信息模型
export const ProductOtherInfoModel = t.Object({
  productBulbIncluded: t.Boolean(),
  productDimmable: t.Boolean(),
  productLampholder: t.String({
    description:
      "Format: ${lampholder color} ${lampholder type}, like: white E27 threaded",
  }),
  productCable: t.String({
    description:
      "Cable Description of the product. Like: ${cable material, like: Natural linen} ${core description, like: 2 core 0.75} ${cable total length: 1600cm+400cm=2m}m white ${Insulation description} cable.",
  }),
  productPlug: t.String({
    description:
      "Plug Description of the product. If the product is Table or Floor, it should have this description. Like: UK3pin",
  }),
  productLabelsDescription: t.Array(ProductSpecLabelDocItemModel),
});

// 主要产品规格模型
export const ProductSpecModel = t.Object({
  productDataInfoVersion: t.String({
    description:
      "Product Spec Version. Format: ${year}-${month}-${day}, like: 2025-08-27.",
  }),
  pooleRef: t.String(),
  commonRef: t.String(),
  proteusRef: t.String(),
  brand: t.String({
    description: "Product Brand. It's alias in product spec is Customer.",
  }),
  suiteName: t.Array(t.String(), {
    description: "Product Suite Name. Could follow with sub suite name.",
  }),
  productZone: t.String({
    description:
      "The first member of product spec category column, described where area the product will be used, like: Indoor | Outdoor, etc..",
  }),
  productCategory: t.String({
    description:
      "The second member of product spec category column, described the product category, like: Table | Flush | Ceiling | Floor | Pendant, etc... ",
  }),
  productType: t.String({
    description:
      "The third member of product spec category column, described the product type, like: Base & Shade | Shade Only | Base Only | Mother&Child, etc...",
  }),
  productMaterials: t.String(),
  productFinishes: t.Array(t.Tuple([t.Number(), t.String()]), {
    description:
      "The Finishes array member should consist of a pair: a reference number and corresponding finish name.",
  }),
  productBarcode: t.String(),
  productEAN128: t.String(),
  productBulbType: t.String({
    description:
      "Format: ${number of bulb}*${bulb description}, like: 5*E27 10W LED.",
  }),
  productIPRating: t.String({
    description: "Format: IP${number}, like: IP67, IP20, etc..",
  }),
  productSafetyClass: t.String({
    description: "Format: Class ${number}, like: Class 2.",
  }),
  productPackaging: ProductPackagingModel,
  other: ProductOtherInfoModel,
});

export type TObjectRecordType = ReturnType<
  typeof t.Object<Record<string, any>>
>;

// console.log(ProductSpecModel);

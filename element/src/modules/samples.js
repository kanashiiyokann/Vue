export default {
  name: "samples",
  parameters: {
    periodList: ["2019年1期", "2019年2期"],
    stateList: [{1: "正常"}, {2: "退回-不清晰"}, {3: "退回-不做帐"}, {4: "退回-其他"}, {5: "跨期"}, {6: "异常"}],
    templateTypeList: [{type: "增值税专用发票（收入）", id: "7816087134932885538"}, {
      type: "增值税普通发票（收入）",
      id: "7816087134932885539"
    }, {type: "增值税电子发票（收入）", id: "7816087134932885540"}, {
      type: "增值税专用发票（成本）",
      id: "7816087134932885541"
    }, {type: "增值税普通发票（成本）", id: "7816087134932885542"}, {
      type: "服务成本（专票）",
      id: "7816087134932885543"
    }, {type: "增值税费用专票", id: "7816087134932885544"}, {type: "购进固定资产（专票）", id: "7816087134932885545"}, {
      type: "缴税回单",
      id: "7816087134932885546"
    }, {type: "银行收款回单（公司）", id: "7816087134932885547"}, {type: "银行收款回单（个人）", id: "7816087134932885548"}, {
      type: "存现",
      id: "7816087134932885549"
    }, {type: "购进固定资产", id: "7816087134932885550"}, {
      type: "银行付款回单（公司）",
      id: "7816087134932885551"
    }, {type: "银行付款回单（个人）", id: "7816087134932885552"}, {type: "取现", id: "7816087134932885553"}, {
      type: "银行利息回单",
      id: "7816087134932885554"
    }, {type: "银行手续费回单", id: "7816087134932885555"}, {type: "购买社保", id: "7816087134932885556"}, {
      type: "购买公积金",
      id: "7816087134932885557"
    }],
    accountedStateList: [{1: "未记账"}, {2: "已记账"}]
  }


}



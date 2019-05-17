<template>
  <div>
    <el-form>
      <el-form-item label="票据类型" label-width="100px">
        <el-select v-model="bill.info.id"
                   @change="templateChange"
        >
          <el-option
            v-for="template in templateList"
            :key="template.id"
            :value="template.id"
            :label="template.type"
          ></el-option>
        </el-select>
      </el-form-item>
      <el-form-item label="票据日期" label-width="100px">
        <el-date-picker v-model="bill.date"></el-date-picker>
      </el-form-item>
      <div v-for="journal in bill.info.journals" :key="journal.id">
        <el-form-item v-for="aux in journal.subject.auxiliaryCategoryList"
                      v-if="aux.name==='客户'|| aux.name==='供应商'"
                      :key="aux.id"
                      :label="aux.name" label-width="100px">
          <el-select v-model="aux.optId" style="width:220px;" placeholder="请选择" @change="auxChange($event,aux)">
            <el-tooltip v-for="item in aux.name==='客户'?customerList:applierList" :key="item.id" :content="item.name"
                        effect="light" placement="right">
              <el-option
                :label="item.name"
                :value="item.id">
              </el-option>
            </el-tooltip>
            <el-option value="" @click.native="auxiliaryEditDialog(aux.name)">新增<i
              class="el-icon-circle-plus-outline"></i></el-option>
          </el-select>
        </el-form-item>
        <el-form-item :label="journal.type" label-width="100px" :key="journal.id">
          <el-input type="text"
                    v-model.trim="journal.amount"
                    @keyup.native="amountTotal(journal.type)"
                    style="width:220px;"></el-input>
        </el-form-item>
      </div>
      <el-form-item>
        <el-button @click="print">print</el-button>
      </el-form-item>
    </el-form>
    <!--辅助核算编辑弹窗-->
    <el-dialog title="新增辅助核算" :visible.sync="dialog.visible">
      <auxiliaryEditor :data="dialog.data" :type="dialog.type"></auxiliaryEditor>
    </el-dialog>
  </div>
</template>

<script>
  import util from '../../modules/util'
  import storage from '../../modules/storage.js'
  import auxiliaryEditor from './auxiliaryEditor'

  const regex = {money: /^-?(?!-0[0-9]+)(?!0[0-9]+)[0-9]+(\.[0-9]{1,4})?$/};
  export default {
    name: "billInfo",
    components: {auxiliaryEditor},
    data() {
      return {
        templateList: templateList,
        billList: billList,
        index: 0,
        bill: billList[0],
        customerList: null,
        applierList: null,
        dialog: {data: null, type: null, visible: false}
      };
    },
    methods: {
      templateChange(templateId) {
        {
          let info = this.templateList.filter(temp => temp.id === templateId);
          if (info.length === 0) {
            console.error("没有匹配的模板！");
          }
          this.bill.info = this.compressInfo(info[0]);
        }
      },
      auxChange($event, aux) {
        if ($event === "") return;
        let src = aux.name === '客户' ? this.customerList : this.applierList;
        src = src.filter(i => i.id === $event)[0];
        aux.optName = src.name;
      },
      mergeAuxiliary(aux1, aux2) {
        aux1 = aux1 || [];
        aux2 = aux2 || [];
        let auxMap = {};
        aux1.forEach(a => {
          auxMap[a.name] = a;
        });

        aux2.forEach(a => {
          if (auxMap[a.name] === undefined) {
            auxMap[a.name] = a;
          }
        });

        aux1 = [];
        for (let key in auxMap) {
          aux1.push(auxMap[key]);
        }

        return aux1;
      },
      compressInfo(info) {
        info = util.clone(info);
        //合并相同金额来源类型的分录,并合计他们的辅助核算
        let journalMap = {};
        info.journals = info.journals || [];
        info.journals.forEach(j => {
          let al1 = [], al2 = [];
          try {
            al1 = journalMap[j.type].subject.auxiliaryCategoryList;
          } catch (e) {
          }
          try {
            j.subject = j.subject || {};
            al2 = j.subject.auxiliaryCategoryList;
          } catch (e) {
          }
          j.subject.auxiliaryCategoryList = this.mergeAuxiliary(al1, al2);
          journalMap[j.type] = j;
        });

        info.journals = [];
        for (let key in journalMap) {
          info.journals.push(journalMap[key]);
        }

        //金额来源排序，辅助核算排序
        info.journals.sort((j1, j2) => {
          let s1 = j1.type === '合计金额' ? 2 : 1;
          let s2 = j2.type === '合计金额' ? 2 : 1;
          return s1 - s2;
        });

        let sorts = {"客户": 1, "供应商": 2};
        info.journals.forEach(j => j.subject.auxiliaryCategoryList.sort((a1, a2) => {
          let s1 = sorts[a1.name] || 9;
          let s2 = sorts[a2.name] || 9;
          return s2 - s1;
        }));
        return info;
      },
      decompressInfo(info) {
        let ret = util.clone(this.templateList.filter(i => i.id === info.id)[0]);

        ret.journals.forEach(j => {
          let src = info.journals.filter(i => i.type === j.type)[0];
          j.amount = src.amount;
          j.subject.auxiliaryCategoryList = j.subject.auxiliaryCategoryList || [];
          j.subject.auxiliaryCategoryList.forEach(a => {
            src = src.subject.auxiliaryCategoryList.filter(i => a.name === i.name)[0];
            if (src !== undefined) {
              a.optId = src.optId;
              a.optName = src.optName;
            }

          });
        });

        return ret;
      },
      print() {
        let data = this.decompressInfo(this.bill.info)
        console.log(JSON.stringify(data));
      },
      amountTotal(type) {
        if (type === '合计金额') return;
        let totals = this.bill.info.journals.filter(i => i.type === '合计金额');
        if (totals.length === 0) {
          return;
        }
        let count = 0;
        this.bill.info.journals.forEach(i => {
          if (i.type !== '合计金额' && i.amount !== null && i.amount.toString().match(regex.money)) {
            count = util.sum(count, parseFloat(i.amount || 0));
          }
        });

        count = count || undefined;
        totals.forEach(i => i.amount = count);

      },
      auxiliaryEditDialog(type) {
        this.dialog.type = type;
        this.dialog.visible = true;
        if (type === '客户') {
          this.dialog.data = this.customerList;
        } else if (type === '供应商') {
          this.dialog.data = this.applierList;
        }
      }
    },
    watch: {
      index() {
        let bill = util.clone(this.billList[this.index]);
        bill.info = this.compressInfo(bill.info);
      }


    },
    mounted: function () {
      this.customerList = storage.get("customers");
      this.applierList = storage.get("appliers");

    }
  }


  let templateList = [
    {
      "id": "7811142286765391937",
      "companyId": "7801976694830727168",
      "createrName": "赵有文24379471",
      "createTime": 1556531658437,
      "type": "增值税专用发票（收入）",
      "summary": "收入",
      "used": null,
      "period": null,
      "journals": [
        {
          "id": "7811142286765391872",
          "companyId": null,
          "createrName": null,
          "createTime": null,
          "subjectId": "7811142279828013056",
          "subjectName": "1122 应收账款",
          "direct": 1,
          "type": "合计金额",
          "amount": null,
          "subject": {
            "id": "7811142279828013056",
            "companyId": "7801976694830727168",
            "createrName": "赵有文24379471",
            "createTime": 1556531658310,
            "parentId": "0",
            "code": "1122",
            "name": "应收账款",
            "subjectCategory": "ASSETS",
            "subjectDetailCategoryKey": "CURRENT_ASSETS",
            "subjectDetailCategoryValue": "流动资产",
            "balanceDirection": "DEBIT",
            "whetherInitSubject": 1,
            "whetherLastSubject": 1,
            "whetherAuxiliary": 1,
            "whetherCount": 0,
            "unit": "",
            "whetherEnable": 1,
            "whetherFinalAdjustment": 0,
            "whetherForeignCurrency": 0,
            "currencyList": [],
            "subjectSeries": 1,
            "auxiliaryCategoryList": [
              {
                "id": "7811142279630880768",
                "companyId": "7801976694830727168",
                "createrName": "赵有文24379471",
                "createTime": 1556531656736,
                "name": "客户",
                "sort": 1,
                "whetherSystem": 1
              }
            ]
          }
        },
        {
          "id": "7811142286765391873",
          "companyId": null,
          "createrName": null,
          "createTime": null,
          "subjectId": "7811142281652535296",
          "subjectName": "5001 主营业务收入",
          "direct": 2,
          "type": "金额",
          "amount": null,
          "subject": {
            "id": "7811142281652535296",
            "companyId": "7801976694830727168",
            "createrName": "赵有文24379471",
            "createTime": 1556531658310,
            "parentId": "0",
            "code": "5001",
            "name": "主营业务收入",
            "subjectCategory": "PROFIT_AND_LOSS",
            "subjectDetailCategoryKey": "BUSINESS_INCOME",
            "subjectDetailCategoryValue": "营业收入",
            "balanceDirection": "CREDIT",
            "whetherInitSubject": 1,
            "whetherLastSubject": 1,
            "whetherAuxiliary": 0,
            "whetherCount": 0,
            "unit": "",
            "whetherEnable": 1,
            "whetherFinalAdjustment": 0,
            "whetherForeignCurrency": 0,
            "currencyList": [],
            "subjectSeries": 1,
            "auxiliaryCategoryList": []
          }
        },
        {
          "id": "7811142286765391874",
          "companyId": null,
          "createrName": null,
          "createTime": null,
          "subjectId": "7811142280721399808",
          "subjectName": "22210106 应交税费_应交增值税_销项税额",
          "direct": 2,
          "type": "税额",
          "amount": null,
          "subject": {
            "id": "7811142280721399808",
            "companyId": "7801976694830727168",
            "createrName": "赵有文24379471",
            "createTime": 1556531658310,
            "parentId": "7811142280608153600",
            "code": "22210106",
            "name": "销项税额",
            "subjectCategory": "LIABILITY",
            "subjectDetailCategoryKey": "CURRENT_LIABILITY",
            "subjectDetailCategoryValue": "流动负债",
            "balanceDirection": "CREDIT",
            "whetherInitSubject": 1,
            "whetherLastSubject": 1,
            "whetherAuxiliary": 0,
            "whetherCount": 0,
            "unit": "",
            "whetherEnable": 1,
            "whetherFinalAdjustment": 0,
            "whetherForeignCurrency": 0,
            "currencyList": [],
            "subjectSeries": 3,
            "auxiliaryCategoryList": []
          }
        }
      ]
    },
    {
      "id": "7811142286765391938",
      "companyId": "7801976694830727168",
      "createrName": "赵有文24379471",
      "createTime": 1556531658437,
      "type": "增值税普通发票（收入）",
      "summary": "收入",
      "used": null,
      "period": null,
      "journals": [
        {
          "id": "7811142286765391875",
          "companyId": null,
          "createrName": null,
          "createTime": null,
          "subjectId": "7811142279828013056",
          "subjectName": "1122 应收账款",
          "direct": 1,
          "type": "合计金额",
          "amount": null,
          "subject": {
            "id": "7811142279828013056",
            "companyId": "7801976694830727168",
            "createrName": "赵有文24379471",
            "createTime": 1556531658310,
            "parentId": "0",
            "code": "1122",
            "name": "应收账款",
            "subjectCategory": "ASSETS",
            "subjectDetailCategoryKey": "CURRENT_ASSETS",
            "subjectDetailCategoryValue": "流动资产",
            "balanceDirection": "DEBIT",
            "whetherInitSubject": 1,
            "whetherLastSubject": 1,
            "whetherAuxiliary": 1,
            "whetherCount": 0,
            "unit": "",
            "whetherEnable": 1,
            "whetherFinalAdjustment": 0,
            "whetherForeignCurrency": 0,
            "currencyList": [],
            "subjectSeries": 1,
            "auxiliaryCategoryList": [
              {
                "id": "7811142279630880768",
                "companyId": "7801976694830727168",
                "createrName": "赵有文24379471",
                "createTime": 1556531656736,
                "name": "客户",
                "sort": 1,
                "whetherSystem": 1
              }
            ]
          }
        },
        {
          "id": "7811142286765391876",
          "companyId": null,
          "createrName": null,
          "createTime": null,
          "subjectId": "7811142281652535296",
          "subjectName": "5001 主营业务收入",
          "direct": 2,
          "type": "金额",
          "amount": null,
          "subject": {
            "id": "7811142281652535296",
            "companyId": "7801976694830727168",
            "createrName": "赵有文24379471",
            "createTime": 1556531658310,
            "parentId": "0",
            "code": "5001",
            "name": "主营业务收入",
            "subjectCategory": "PROFIT_AND_LOSS",
            "subjectDetailCategoryKey": "BUSINESS_INCOME",
            "subjectDetailCategoryValue": "营业收入",
            "balanceDirection": "CREDIT",
            "whetherInitSubject": 1,
            "whetherLastSubject": 1,
            "whetherAuxiliary": 0,
            "whetherCount": 0,
            "unit": "",
            "whetherEnable": 1,
            "whetherFinalAdjustment": 0,
            "whetherForeignCurrency": 0,
            "currencyList": [],
            "subjectSeries": 1,
            "auxiliaryCategoryList": []
          }
        },
        {
          "id": "7811142286765391877",
          "companyId": null,
          "createrName": null,
          "createTime": null,
          "subjectId": "7811142280721399808",
          "subjectName": "22210106 应交税费_应交增值税_销项税额",
          "direct": 2,
          "type": "税额",
          "amount": null,
          "subject": {
            "id": "7811142280721399808",
            "companyId": "7801976694830727168",
            "createrName": "赵有文24379471",
            "createTime": 1556531658310,
            "parentId": "7811142280608153600",
            "code": "22210106",
            "name": "销项税额",
            "subjectCategory": "LIABILITY",
            "subjectDetailCategoryKey": "CURRENT_LIABILITY",
            "subjectDetailCategoryValue": "流动负债",
            "balanceDirection": "CREDIT",
            "whetherInitSubject": 1,
            "whetherLastSubject": 1,
            "whetherAuxiliary": 0,
            "whetherCount": 0,
            "unit": "",
            "whetherEnable": 1,
            "whetherFinalAdjustment": 0,
            "whetherForeignCurrency": 0,
            "currencyList": [],
            "subjectSeries": 3,
            "auxiliaryCategoryList": []
          }
        }
      ]
    },
    {
      "id": "7811142286765391939",
      "companyId": "7801976694830727168",
      "createrName": "赵有文24379471",
      "createTime": 1556531658437,
      "type": "增值税电子发票（收入）",
      "summary": "收入",
      "used": null,
      "period": null,
      "journals": [
        {
          "id": "7811142286765391878",
          "companyId": null,
          "createrName": null,
          "createTime": null,
          "subjectId": "7811142279828013056",
          "subjectName": "1122 应收账款",
          "direct": 1,
          "type": "合计金额",
          "amount": null,
          "subject": {
            "id": "7811142279828013056",
            "companyId": "7801976694830727168",
            "createrName": "赵有文24379471",
            "createTime": 1556531658310,
            "parentId": "0",
            "code": "1122",
            "name": "应收账款",
            "subjectCategory": "ASSETS",
            "subjectDetailCategoryKey": "CURRENT_ASSETS",
            "subjectDetailCategoryValue": "流动资产",
            "balanceDirection": "DEBIT",
            "whetherInitSubject": 1,
            "whetherLastSubject": 1,
            "whetherAuxiliary": 1,
            "whetherCount": 0,
            "unit": "",
            "whetherEnable": 1,
            "whetherFinalAdjustment": 0,
            "whetherForeignCurrency": 0,
            "currencyList": [],
            "subjectSeries": 1,
            "auxiliaryCategoryList": [
              {
                "id": "7811142279630880768",
                "companyId": "7801976694830727168",
                "createrName": "赵有文24379471",
                "createTime": 1556531656736,
                "name": "客户",
                "sort": 1,
                "whetherSystem": 1
              }
            ]
          }
        },
        {
          "id": "7811142286765391879",
          "companyId": null,
          "createrName": null,
          "createTime": null,
          "subjectId": "7811142281652535296",
          "subjectName": "5001 主营业务收入",
          "direct": 2,
          "type": "金额",
          "amount": null,
          "subject": {
            "id": "7811142281652535296",
            "companyId": "7801976694830727168",
            "createrName": "赵有文24379471",
            "createTime": 1556531658310,
            "parentId": "0",
            "code": "5001",
            "name": "主营业务收入",
            "subjectCategory": "PROFIT_AND_LOSS",
            "subjectDetailCategoryKey": "BUSINESS_INCOME",
            "subjectDetailCategoryValue": "营业收入",
            "balanceDirection": "CREDIT",
            "whetherInitSubject": 1,
            "whetherLastSubject": 1,
            "whetherAuxiliary": 0,
            "whetherCount": 0,
            "unit": "",
            "whetherEnable": 1,
            "whetherFinalAdjustment": 0,
            "whetherForeignCurrency": 0,
            "currencyList": [],
            "subjectSeries": 1,
            "auxiliaryCategoryList": []
          }
        },
        {
          "id": "7811142286765391880",
          "companyId": null,
          "createrName": null,
          "createTime": null,
          "subjectId": "7811142280721399808",
          "subjectName": "22210106 应交税费_应交增值税_销项税额",
          "direct": 2,
          "type": "税额",
          "amount": null,
          "subject": {
            "id": "7811142280721399808",
            "companyId": "7801976694830727168",
            "createrName": "赵有文24379471",
            "createTime": 1556531658310,
            "parentId": "7811142280608153600",
            "code": "22210106",
            "name": "销项税额",
            "subjectCategory": "LIABILITY",
            "subjectDetailCategoryKey": "CURRENT_LIABILITY",
            "subjectDetailCategoryValue": "流动负债",
            "balanceDirection": "CREDIT",
            "whetherInitSubject": 1,
            "whetherLastSubject": 1,
            "whetherAuxiliary": 0,
            "whetherCount": 0,
            "unit": "",
            "whetherEnable": 1,
            "whetherFinalAdjustment": 0,
            "whetherForeignCurrency": 0,
            "currencyList": [],
            "subjectSeries": 3,
            "auxiliaryCategoryList": []
          }
        }
      ]
    },
    {
      "id": "7811142286765391940",
      "companyId": "7801976694830727168",
      "createrName": "赵有文24379471",
      "createTime": 1556531658437,
      "type": "增值税专用发票（成本）",
      "summary": "购进商品",
      "used": null,
      "period": null,
      "journals": [
        {
          "id": "7811142286765391881",
          "companyId": null,
          "createrName": null,
          "createTime": null,
          "subjectId": "7811142279999979520",
          "subjectName": "1405 库存商品",
          "direct": 1,
          "type": "金额",
          "amount": null,
          "subject": {
            "id": "7811142279999979520",
            "companyId": "7801976694830727168",
            "createrName": "赵有文24379471",
            "createTime": 1556531658310,
            "parentId": "0",
            "code": "1405",
            "name": "库存商品",
            "subjectCategory": "ASSETS",
            "subjectDetailCategoryKey": "CURRENT_ASSETS",
            "subjectDetailCategoryValue": "流动资产",
            "balanceDirection": "DEBIT",
            "whetherInitSubject": 1,
            "whetherLastSubject": 1,
            "whetherAuxiliary": 0,
            "whetherCount": 0,
            "unit": "",
            "whetherEnable": 1,
            "whetherFinalAdjustment": 0,
            "whetherForeignCurrency": 0,
            "currencyList": [],
            "subjectSeries": 1,
            "auxiliaryCategoryList": []
          }
        },
        {
          "id": "7811142286765391882",
          "companyId": null,
          "createrName": null,
          "createTime": null,
          "subjectId": "7811142280624930816",
          "subjectName": "22210101 应交税费_应交增值税_进项税额",
          "direct": 1,
          "type": "税额",
          "amount": null,
          "subject": {
            "id": "7811142280624930816",
            "companyId": "7801976694830727168",
            "createrName": "赵有文24379471",
            "createTime": 1556531658310,
            "parentId": "7811142280608153600",
            "code": "22210101",
            "name": "进项税额",
            "subjectCategory": "LIABILITY",
            "subjectDetailCategoryKey": "CURRENT_LIABILITY",
            "subjectDetailCategoryValue": "流动负债",
            "balanceDirection": "DEBIT",
            "whetherInitSubject": 1,
            "whetherLastSubject": 1,
            "whetherAuxiliary": 0,
            "whetherCount": 0,
            "unit": "",
            "whetherEnable": 1,
            "whetherFinalAdjustment": 0,
            "whetherForeignCurrency": 0,
            "currencyList": [],
            "subjectSeries": 3,
            "auxiliaryCategoryList": []
          }
        },
        {
          "id": "7811142286765391883",
          "companyId": null,
          "createrName": null,
          "createTime": null,
          "subjectId": "7811142280524267520",
          "subjectName": "2202 应付账款",
          "direct": 2,
          "type": "合计金额",
          "amount": null,
          "subject": {
            "id": "7811142280524267520",
            "companyId": "7801976694830727168",
            "createrName": "赵有文24379471",
            "createTime": 1556531658310,
            "parentId": "0",
            "code": "2202",
            "name": "应付账款",
            "subjectCategory": "LIABILITY",
            "subjectDetailCategoryKey": "CURRENT_LIABILITY",
            "subjectDetailCategoryValue": "流动负债",
            "balanceDirection": "CREDIT",
            "whetherInitSubject": 1,
            "whetherLastSubject": 1,
            "whetherAuxiliary": 1,
            "whetherCount": 0,
            "unit": "",
            "whetherEnable": 1,
            "whetherFinalAdjustment": 0,
            "whetherForeignCurrency": 0,
            "currencyList": [],
            "subjectSeries": 1,
            "auxiliaryCategoryList": [
              {
                "id": "7811142279630880769",
                "companyId": "7801976694830727168",
                "createrName": "赵有文24379471",
                "createTime": 1556531656736,
                "name": "供应商",
                "sort": 2,
                "whetherSystem": 1
              }
            ]
          }
        }
      ]
    },
    {
      "id": "7811142286765391941",
      "companyId": "7801976694830727168",
      "createrName": "赵有文24379471",
      "createTime": 1556531658437,
      "type": "增值税普通发票（成本）",
      "summary": "购进商品",
      "used": null,
      "period": null,
      "journals": [
        {
          "id": "7811142286765391884",
          "companyId": null,
          "createrName": null,
          "createTime": null,
          "subjectId": "7811142279999979520",
          "subjectName": "1405 库存商品",
          "direct": 1,
          "type": "金额",
          "amount": null,
          "subject": {
            "id": "7811142279999979520",
            "companyId": "7801976694830727168",
            "createrName": "赵有文24379471",
            "createTime": 1556531658310,
            "parentId": "0",
            "code": "1405",
            "name": "库存商品",
            "subjectCategory": "ASSETS",
            "subjectDetailCategoryKey": "CURRENT_ASSETS",
            "subjectDetailCategoryValue": "流动资产",
            "balanceDirection": "DEBIT",
            "whetherInitSubject": 1,
            "whetherLastSubject": 1,
            "whetherAuxiliary": 0,
            "whetherCount": 0,
            "unit": "",
            "whetherEnable": 1,
            "whetherFinalAdjustment": 0,
            "whetherForeignCurrency": 0,
            "currencyList": [],
            "subjectSeries": 1,
            "auxiliaryCategoryList": []
          }
        },
        {
          "id": "7811142286765391885",
          "companyId": null,
          "createrName": null,
          "createTime": null,
          "subjectId": "7811142280524267520",
          "subjectName": "2202 应付账款",
          "direct": 2,
          "type": "金额",
          "amount": null,
          "subject": {
            "id": "7811142280524267520",
            "companyId": "7801976694830727168",
            "createrName": "赵有文24379471",
            "createTime": 1556531658310,
            "parentId": "0",
            "code": "2202",
            "name": "应付账款",
            "subjectCategory": "LIABILITY",
            "subjectDetailCategoryKey": "CURRENT_LIABILITY",
            "subjectDetailCategoryValue": "流动负债",
            "balanceDirection": "CREDIT",
            "whetherInitSubject": 1,
            "whetherLastSubject": 1,
            "whetherAuxiliary": 1,
            "whetherCount": 0,
            "unit": "",
            "whetherEnable": 1,
            "whetherFinalAdjustment": 0,
            "whetherForeignCurrency": 0,
            "currencyList": [],
            "subjectSeries": 1,
            "auxiliaryCategoryList": [
              {
                "id": "7811142279630880769",
                "companyId": "7801976694830727168",
                "createrName": "赵有文24379471",
                "createTime": 1556531656736,
                "name": "供应商",
                "sort": 2,
                "whetherSystem": 1
              }
            ]
          }
        }
      ]
    },
    {
      "id": "7811142286765391942",
      "companyId": "7801976694830727168",
      "createrName": "赵有文24379471",
      "createTime": 1556531658437,
      "type": "服务成本（专票）",
      "summary": "服务成本",
      "used": null,
      "period": null,
      "journals": [
        {
          "id": "7811142286765391886",
          "companyId": null,
          "createrName": null,
          "createTime": null,
          "subjectId": "7811142281870639104",
          "subjectName": "5401 主营业务成本",
          "direct": 1,
          "type": "金额",
          "amount": null,
          "subject": {
            "id": "7811142281870639104",
            "companyId": "7801976694830727168",
            "createrName": "赵有文24379471",
            "createTime": 1556531658310,
            "parentId": "0",
            "code": "5401",
            "name": "主营业务成本",
            "subjectCategory": "PROFIT_AND_LOSS",
            "subjectDetailCategoryKey": "OPERATING_COSTS_AND_TAXES",
            "subjectDetailCategoryValue": "营业成本及税金",
            "balanceDirection": "DEBIT",
            "whetherInitSubject": 1,
            "whetherLastSubject": 1,
            "whetherAuxiliary": 0,
            "whetherCount": 0,
            "unit": "",
            "whetherEnable": 1,
            "whetherFinalAdjustment": 0,
            "whetherForeignCurrency": 0,
            "currencyList": [],
            "subjectSeries": 1,
            "auxiliaryCategoryList": []
          }
        },
        {
          "id": "7811142286765391887",
          "companyId": null,
          "createrName": null,
          "createTime": null,
          "subjectId": "7811142280624930816",
          "subjectName": "22210101 应交税费_应交增值税_进项税额",
          "direct": 1,
          "type": "税额",
          "amount": null,
          "subject": {
            "id": "7811142280624930816",
            "companyId": "7801976694830727168",
            "createrName": "赵有文24379471",
            "createTime": 1556531658310,
            "parentId": "7811142280608153600",
            "code": "22210101",
            "name": "进项税额",
            "subjectCategory": "LIABILITY",
            "subjectDetailCategoryKey": "CURRENT_LIABILITY",
            "subjectDetailCategoryValue": "流动负债",
            "balanceDirection": "DEBIT",
            "whetherInitSubject": 1,
            "whetherLastSubject": 1,
            "whetherAuxiliary": 0,
            "whetherCount": 0,
            "unit": "",
            "whetherEnable": 1,
            "whetherFinalAdjustment": 0,
            "whetherForeignCurrency": 0,
            "currencyList": [],
            "subjectSeries": 3,
            "auxiliaryCategoryList": []
          }
        },
        {
          "id": "7811142286765391888",
          "companyId": null,
          "createrName": null,
          "createTime": null,
          "subjectId": "7811142280524267520",
          "subjectName": "2202 应付账款",
          "direct": 2,
          "type": "合计金额",
          "amount": null,
          "subject": {
            "id": "7811142280524267520",
            "companyId": "7801976694830727168",
            "createrName": "赵有文24379471",
            "createTime": 1556531658310,
            "parentId": "0",
            "code": "2202",
            "name": "应付账款",
            "subjectCategory": "LIABILITY",
            "subjectDetailCategoryKey": "CURRENT_LIABILITY",
            "subjectDetailCategoryValue": "流动负债",
            "balanceDirection": "CREDIT",
            "whetherInitSubject": 1,
            "whetherLastSubject": 1,
            "whetherAuxiliary": 1,
            "whetherCount": 0,
            "unit": "",
            "whetherEnable": 1,
            "whetherFinalAdjustment": 0,
            "whetherForeignCurrency": 0,
            "currencyList": [],
            "subjectSeries": 1,
            "auxiliaryCategoryList": [
              {
                "id": "7811142279630880769",
                "companyId": "7801976694830727168",
                "createrName": "赵有文24379471",
                "createTime": 1556531656736,
                "name": "供应商",
                "sort": 2,
                "whetherSystem": 1
              }
            ]
          }
        }
      ]
    },
    {
      "id": "7811142286765391943",
      "companyId": "7801976694830727168",
      "createrName": "赵有文24379471",
      "createTime": 1556531658437,
      "type": "增值税费用专票",
      "summary": "费用",
      "used": null,
      "period": null,
      "journals": [
        {
          "id": "7811142286765391889",
          "companyId": null,
          "createrName": null,
          "createTime": null,
          "subjectId": "7811142285481934848",
          "subjectName": "5602 管理费用",
          "direct": 1,
          "type": "金额",
          "amount": null,
          "subject": {
            "id": "7811142285481934848",
            "companyId": "7801976694830727168",
            "createrName": "赵有文24379471",
            "createTime": 1556531658310,
            "parentId": "0",
            "code": "5602",
            "name": "管理费用",
            "subjectCategory": "PROFIT_AND_LOSS",
            "subjectDetailCategoryKey": "PERIOD_COST",
            "subjectDetailCategoryValue": "期间费用",
            "balanceDirection": "DEBIT",
            "whetherInitSubject": 1,
            "whetherLastSubject": 0,
            "whetherAuxiliary": 0,
            "whetherCount": 0,
            "unit": "",
            "whetherEnable": 1,
            "whetherFinalAdjustment": 0,
            "whetherForeignCurrency": 0,
            "currencyList": [],
            "subjectSeries": 1,
            "auxiliaryCategoryList": []
          }
        },
        {
          "id": "7811142286765391890",
          "companyId": null,
          "createrName": null,
          "createTime": null,
          "subjectId": "7811142280624930816",
          "subjectName": "22210101 应交税费_应交增值税_进项税额",
          "direct": 1,
          "type": "税额",
          "amount": null,
          "subject": {
            "id": "7811142280624930816",
            "companyId": "7801976694830727168",
            "createrName": "赵有文24379471",
            "createTime": 1556531658310,
            "parentId": "7811142280608153600",
            "code": "22210101",
            "name": "进项税额",
            "subjectCategory": "LIABILITY",
            "subjectDetailCategoryKey": "CURRENT_LIABILITY",
            "subjectDetailCategoryValue": "流动负债",
            "balanceDirection": "DEBIT",
            "whetherInitSubject": 1,
            "whetherLastSubject": 1,
            "whetherAuxiliary": 0,
            "whetherCount": 0,
            "unit": "",
            "whetherEnable": 1,
            "whetherFinalAdjustment": 0,
            "whetherForeignCurrency": 0,
            "currencyList": [],
            "subjectSeries": 3,
            "auxiliaryCategoryList": []
          }
        },
        {
          "id": "7811142286765391891",
          "companyId": null,
          "createrName": null,
          "createTime": null,
          "subjectId": "7811142281098887168",
          "subjectName": "2241 其他应付款",
          "direct": 2,
          "type": "合计金额",
          "amount": null,
          "subject": {
            "id": "7811142281098887168",
            "companyId": "7801976694830727168",
            "createrName": "赵有文24379471",
            "createTime": 1556531658310,
            "parentId": "0",
            "code": "2241",
            "name": "其他应付款",
            "subjectCategory": "LIABILITY",
            "subjectDetailCategoryKey": "CURRENT_LIABILITY",
            "subjectDetailCategoryValue": "流动负债",
            "balanceDirection": "CREDIT",
            "whetherInitSubject": 1,
            "whetherLastSubject": 1,
            "whetherAuxiliary": 0,
            "whetherCount": 0,
            "unit": "",
            "whetherEnable": 1,
            "whetherFinalAdjustment": 0,
            "whetherForeignCurrency": 0,
            "currencyList": [],
            "subjectSeries": 1,
            "auxiliaryCategoryList": []
          }
        }
      ]
    },
    {
      "id": "7811142286765391944",
      "companyId": "7801976694830727168",
      "createrName": "赵有文24379471",
      "createTime": 1556531658437,
      "type": "购进固定资产（专票）",
      "summary": "购进固定资产",
      "used": null,
      "period": null,
      "journals": [
        {
          "id": "7811142286765391892",
          "companyId": null,
          "createrName": null,
          "createTime": null,
          "subjectId": "7811142280205500416",
          "subjectName": "1601 固定资产",
          "direct": 1,
          "type": "金额",
          "amount": null,
          "subject": {
            "id": "7811142280205500416",
            "companyId": "7801976694830727168",
            "createrName": "赵有文24379471",
            "createTime": 1556531658310,
            "parentId": "0",
            "code": "1601",
            "name": "固定资产",
            "subjectCategory": "ASSETS",
            "subjectDetailCategoryKey": "UN_CURRENT_ASSETS",
            "subjectDetailCategoryValue": "非流动资产",
            "balanceDirection": "DEBIT",
            "whetherInitSubject": 1,
            "whetherLastSubject": 1,
            "whetherAuxiliary": 0,
            "whetherCount": 0,
            "unit": "",
            "whetherEnable": 1,
            "whetherFinalAdjustment": 0,
            "whetherForeignCurrency": 0,
            "currencyList": [],
            "subjectSeries": 1,
            "auxiliaryCategoryList": []
          }
        },
        {
          "id": "7811142286765391893",
          "companyId": null,
          "createrName": null,
          "createTime": null,
          "subjectId": "7811142280624930816",
          "subjectName": "22210101 应交税费_应交增值税_进项税额",
          "direct": 1,
          "type": "税额",
          "amount": null,
          "subject": {
            "id": "7811142280624930816",
            "companyId": "7801976694830727168",
            "createrName": "赵有文24379471",
            "createTime": 1556531658310,
            "parentId": "7811142280608153600",
            "code": "22210101",
            "name": "进项税额",
            "subjectCategory": "LIABILITY",
            "subjectDetailCategoryKey": "CURRENT_LIABILITY",
            "subjectDetailCategoryValue": "流动负债",
            "balanceDirection": "DEBIT",
            "whetherInitSubject": 1,
            "whetherLastSubject": 1,
            "whetherAuxiliary": 0,
            "whetherCount": 0,
            "unit": "",
            "whetherEnable": 1,
            "whetherFinalAdjustment": 0,
            "whetherForeignCurrency": 0,
            "currencyList": [],
            "subjectSeries": 3,
            "auxiliaryCategoryList": []
          }
        },
        {
          "id": "7811142286765391894",
          "companyId": null,
          "createrName": null,
          "createTime": null,
          "subjectId": "7811142279651852288",
          "subjectName": "1001 库存现金",
          "direct": 2,
          "type": "合计金额",
          "amount": null,
          "subject": {
            "id": "7811142279651852288",
            "companyId": "7801976694830727168",
            "createrName": "赵有文24379471",
            "createTime": 1556531658310,
            "parentId": "0",
            "code": "1001",
            "name": "库存现金",
            "subjectCategory": "ASSETS",
            "subjectDetailCategoryKey": "CURRENT_ASSETS",
            "subjectDetailCategoryValue": "流动资产",
            "balanceDirection": "DEBIT",
            "whetherInitSubject": 1,
            "whetherLastSubject": 1,
            "whetherAuxiliary": 0,
            "whetherCount": 0,
            "unit": "",
            "whetherEnable": 1,
            "whetherFinalAdjustment": 0,
            "whetherForeignCurrency": 0,
            "currencyList": [],
            "subjectSeries": 1,
            "auxiliaryCategoryList": []
          }
        }
      ]
    },
    {
      "id": "7811142286765391945",
      "companyId": "7801976694830727168",
      "createrName": "赵有文24379471",
      "createTime": 1556531658437,
      "type": "缴税回单",
      "summary": "缴税",
      "used": null,
      "period": null,
      "journals": [
        {
          "id": "7811142286765391895",
          "companyId": null,
          "createrName": null,
          "createTime": null,
          "subjectId": "7811142280792702976",
          "subjectName": "222102 应交税费_未交增值税",
          "direct": 1,
          "type": "增值税",
          "amount": null,
          "subject": {
            "id": "7811142280792702976",
            "companyId": "7801976694830727168",
            "createrName": "赵有文24379471",
            "createTime": 1556531658310,
            "parentId": "7811142280591376384",
            "code": "222102",
            "name": "未交增值税",
            "subjectCategory": "LIABILITY",
            "subjectDetailCategoryKey": "CURRENT_LIABILITY",
            "subjectDetailCategoryValue": "流动负债",
            "balanceDirection": "CREDIT",
            "whetherInitSubject": 1,
            "whetherLastSubject": 1,
            "whetherAuxiliary": 0,
            "whetherCount": 0,
            "unit": "",
            "whetherEnable": 1,
            "whetherFinalAdjustment": 0,
            "whetherForeignCurrency": 0,
            "currencyList": [],
            "subjectSeries": 2,
            "auxiliaryCategoryList": []
          }
        },
        {
          "id": "7811142286765391896",
          "companyId": null,
          "createrName": null,
          "createTime": null,
          "subjectId": "7811142280918532096",
          "subjectName": "222108 应交税费_应交城市维护建设税",
          "direct": 1,
          "type": "城建税",
          "amount": null,
          "subject": {
            "id": "7811142280918532096",
            "companyId": "7801976694830727168",
            "createrName": "赵有文24379471",
            "createTime": 1556531658310,
            "parentId": "7811142280591376384",
            "code": "222108",
            "name": "应交城市维护建设税",
            "subjectCategory": "LIABILITY",
            "subjectDetailCategoryKey": "CURRENT_LIABILITY",
            "subjectDetailCategoryValue": "流动负债",
            "balanceDirection": "CREDIT",
            "whetherInitSubject": 1,
            "whetherLastSubject": 1,
            "whetherAuxiliary": 0,
            "whetherCount": 0,
            "unit": "",
            "whetherEnable": 1,
            "whetherFinalAdjustment": 0,
            "whetherForeignCurrency": 0,
            "currencyList": [],
            "subjectSeries": 2,
            "auxiliaryCategoryList": []
          }
        },
        {
          "id": "7811142286765391897",
          "companyId": null,
          "createrName": null,
          "createTime": null,
          "subjectId": "7811142281023389696",
          "subjectName": "222113 应交税费_教育费附加",
          "direct": 1,
          "type": "教育费附加",
          "amount": null,
          "subject": {
            "id": "7811142281023389696",
            "companyId": "7801976694830727168",
            "createrName": "赵有文24379471",
            "createTime": 1556531658310,
            "parentId": "7811142280591376384",
            "code": "222113",
            "name": "教育费附加",
            "subjectCategory": "LIABILITY",
            "subjectDetailCategoryKey": "CURRENT_LIABILITY",
            "subjectDetailCategoryValue": "流动负债",
            "balanceDirection": "CREDIT",
            "whetherInitSubject": 1,
            "whetherLastSubject": 1,
            "whetherAuxiliary": 0,
            "whetherCount": 0,
            "unit": "",
            "whetherEnable": 1,
            "whetherFinalAdjustment": 0,
            "whetherForeignCurrency": 0,
            "currencyList": [],
            "subjectSeries": 2,
            "auxiliaryCategoryList": []
          }
        },
        {
          "id": "7811142286765391898",
          "companyId": null,
          "createrName": null,
          "createTime": null,
          "subjectId": "7811142281048555520",
          "subjectName": "222114 应交税费_地方教育费附加",
          "direct": 1,
          "type": "地方教育费附加",
          "amount": null,
          "subject": {
            "id": "7811142281048555520",
            "companyId": "7801976694830727168",
            "createrName": "赵有文24379471",
            "createTime": 1556531658310,
            "parentId": "7811142280591376384",
            "code": "222114",
            "name": "地方教育费附加",
            "subjectCategory": "LIABILITY",
            "subjectDetailCategoryKey": "CURRENT_LIABILITY",
            "subjectDetailCategoryValue": "流动负债",
            "balanceDirection": "CREDIT",
            "whetherInitSubject": 1,
            "whetherLastSubject": 1,
            "whetherAuxiliary": 0,
            "whetherCount": 0,
            "unit": "",
            "whetherEnable": 1,
            "whetherFinalAdjustment": 0,
            "whetherForeignCurrency": 0,
            "currencyList": [],
            "subjectSeries": 2,
            "auxiliaryCategoryList": []
          }
        },
        {
          "id": "7811142286765391899",
          "companyId": null,
          "createrName": null,
          "createTime": null,
          "subjectId": "7811142280876589056",
          "subjectName": "222106 应交税费_应交所得税",
          "direct": 1,
          "type": "企业所得税",
          "amount": null,
          "subject": {
            "id": "7811142280876589056",
            "companyId": "7801976694830727168",
            "createrName": "赵有文24379471",
            "createTime": 1556531658310,
            "parentId": "7811142280591376384",
            "code": "222106",
            "name": "应交所得税",
            "subjectCategory": "LIABILITY",
            "subjectDetailCategoryKey": "CURRENT_LIABILITY",
            "subjectDetailCategoryValue": "流动负债",
            "balanceDirection": "CREDIT",
            "whetherInitSubject": 1,
            "whetherLastSubject": 1,
            "whetherAuxiliary": 0,
            "whetherCount": 0,
            "unit": "",
            "whetherEnable": 1,
            "whetherFinalAdjustment": 0,
            "whetherForeignCurrency": 0,
            "currencyList": [],
            "subjectSeries": 2,
            "auxiliaryCategoryList": []
          }
        },
        {
          "id": "7811142286765391900",
          "companyId": null,
          "createrName": null,
          "createTime": null,
          "subjectId": "7811142281006612480",
          "subjectName": "222112 应交税费_应交个人所得税",
          "direct": 1,
          "type": "个人所得税",
          "amount": null,
          "subject": {
            "id": "7811142281006612480",
            "companyId": "7801976694830727168",
            "createrName": "赵有文24379471",
            "createTime": 1556531658310,
            "parentId": "7811142280591376384",
            "code": "222112",
            "name": "应交个人所得税",
            "subjectCategory": "LIABILITY",
            "subjectDetailCategoryKey": "CURRENT_LIABILITY",
            "subjectDetailCategoryValue": "流动负债",
            "balanceDirection": "CREDIT",
            "whetherInitSubject": 1,
            "whetherLastSubject": 1,
            "whetherAuxiliary": 0,
            "whetherCount": 0,
            "unit": "",
            "whetherEnable": 1,
            "whetherFinalAdjustment": 0,
            "whetherForeignCurrency": 0,
            "currencyList": [],
            "subjectSeries": 2,
            "auxiliaryCategoryList": []
          }
        },
        {
          "id": "7811142286765391901",
          "companyId": null,
          "createrName": null,
          "createTime": null,
          "subjectId": "7811142279685406720",
          "subjectName": "100201 银行存款_基本户",
          "direct": 2,
          "type": "合计金额",
          "amount": null,
          "subject": {
            "id": "7811142279685406720",
            "companyId": "7801976694830727168",
            "createrName": "赵有文24379471",
            "createTime": 1556531658310,
            "parentId": "7811142279668629504",
            "code": "100201",
            "name": "基本户",
            "subjectCategory": "ASSETS",
            "subjectDetailCategoryKey": "CURRENT_ASSETS",
            "subjectDetailCategoryValue": "流动资产",
            "balanceDirection": "DEBIT",
            "whetherInitSubject": 1,
            "whetherLastSubject": 1,
            "whetherAuxiliary": 0,
            "whetherCount": 0,
            "unit": "",
            "whetherEnable": 1,
            "whetherFinalAdjustment": 0,
            "whetherForeignCurrency": 0,
            "currencyList": [],
            "subjectSeries": 2,
            "auxiliaryCategoryList": []
          }
        }
      ]
    },
    {
      "id": "7811142286765391946",
      "companyId": "7801976694830727168",
      "createrName": "赵有文24379471",
      "createTime": 1556531658437,
      "type": "银行收款回单（公司）",
      "summary": "本月银行收款",
      "used": null,
      "period": null,
      "journals": [
        {
          "id": "7811142286765391902",
          "companyId": null,
          "createrName": null,
          "createTime": null,
          "subjectId": "7811142279685406720",
          "subjectName": "100201_银行存款_基本户",
          "direct": 1,
          "type": "金额",
          "amount": null,
          "subject": {
            "id": "7811142279685406720",
            "companyId": "7801976694830727168",
            "createrName": "赵有文24379471",
            "createTime": 1556531658310,
            "parentId": "7811142279668629504",
            "code": "100201",
            "name": "基本户",
            "subjectCategory": "ASSETS",
            "subjectDetailCategoryKey": "CURRENT_ASSETS",
            "subjectDetailCategoryValue": "流动资产",
            "balanceDirection": "DEBIT",
            "whetherInitSubject": 1,
            "whetherLastSubject": 1,
            "whetherAuxiliary": 0,
            "whetherCount": 0,
            "unit": "",
            "whetherEnable": 1,
            "whetherFinalAdjustment": 0,
            "whetherForeignCurrency": 0,
            "currencyList": [],
            "subjectSeries": 2,
            "auxiliaryCategoryList": []
          }
        },
        {
          "id": "7811142286765391903",
          "companyId": null,
          "createrName": null,
          "createTime": null,
          "subjectId": "7811142279828013056",
          "subjectName": "1122_应收账款",
          "direct": 2,
          "type": "金额",
          "amount": null,
          "subject": {
            "id": "7811142279828013056",
            "companyId": "7801976694830727168",
            "createrName": "赵有文24379471",
            "createTime": 1556531658310,
            "parentId": "0",
            "code": "1122",
            "name": "应收账款",
            "subjectCategory": "ASSETS",
            "subjectDetailCategoryKey": "CURRENT_ASSETS",
            "subjectDetailCategoryValue": "流动资产",
            "balanceDirection": "DEBIT",
            "whetherInitSubject": 1,
            "whetherLastSubject": 1,
            "whetherAuxiliary": 1,
            "whetherCount": 0,
            "unit": "",
            "whetherEnable": 1,
            "whetherFinalAdjustment": 0,
            "whetherForeignCurrency": 0,
            "currencyList": [],
            "subjectSeries": 1,
            "auxiliaryCategoryList": [
              {
                "id": "7811142279630880768",
                "companyId": "7801976694830727168",
                "createrName": "赵有文24379471",
                "createTime": 1556531656736,
                "name": "客户",
                "sort": 1,
                "whetherSystem": 1
              }
            ]
          }
        }
      ]
    },
    {
      "id": "7811142286765391947",
      "companyId": "7801976694830727168",
      "createrName": "赵有文24379471",
      "createTime": 1556531658437,
      "type": "银行收款回单（个人）",
      "summary": "本月银行收款",
      "used": null,
      "period": null,
      "journals": [
        {
          "id": "7811142286765391904",
          "companyId": null,
          "createrName": null,
          "createTime": null,
          "subjectId": "7811142279685406720",
          "subjectName": "100201_银行存款_基本户",
          "direct": 1,
          "type": "金额",
          "amount": null,
          "subject": {
            "id": "7811142279685406720",
            "companyId": "7801976694830727168",
            "createrName": "赵有文24379471",
            "createTime": 1556531658310,
            "parentId": "7811142279668629504",
            "code": "100201",
            "name": "基本户",
            "subjectCategory": "ASSETS",
            "subjectDetailCategoryKey": "CURRENT_ASSETS",
            "subjectDetailCategoryValue": "流动资产",
            "balanceDirection": "DEBIT",
            "whetherInitSubject": 1,
            "whetherLastSubject": 1,
            "whetherAuxiliary": 0,
            "whetherCount": 0,
            "unit": "",
            "whetherEnable": 1,
            "whetherFinalAdjustment": 0,
            "whetherForeignCurrency": 0,
            "currencyList": [],
            "subjectSeries": 2,
            "auxiliaryCategoryList": []
          }
        },
        {
          "id": "7811142286765391905",
          "companyId": null,
          "createrName": null,
          "createTime": null,
          "subjectId": "7811142279899316224",
          "subjectName": "1221 其他应收款",
          "direct": 2,
          "type": "金额",
          "amount": null,
          "subject": {
            "id": "7811142279899316224",
            "companyId": "7801976694830727168",
            "createrName": "赵有文24379471",
            "createTime": 1556531658310,
            "parentId": "0",
            "code": "1221",
            "name": "其他应收款",
            "subjectCategory": "ASSETS",
            "subjectDetailCategoryKey": "CURRENT_ASSETS",
            "subjectDetailCategoryValue": "流动资产",
            "balanceDirection": "DEBIT",
            "whetherInitSubject": 1,
            "whetherLastSubject": 0,
            "whetherAuxiliary": 0,
            "whetherCount": 0,
            "unit": "",
            "whetherEnable": 1,
            "whetherFinalAdjustment": 0,
            "whetherForeignCurrency": 0,
            "currencyList": [],
            "subjectSeries": 1,
            "auxiliaryCategoryList": []
          }
        }
      ]
    },
    {
      "id": "7811142286765391948",
      "companyId": "7801976694830727168",
      "createrName": "赵有文24379471",
      "createTime": 1556531658437,
      "type": "存现",
      "summary": "存现",
      "used": null,
      "period": null,
      "journals": [
        {
          "id": "7811142286765391906",
          "companyId": null,
          "createrName": null,
          "createTime": null,
          "subjectId": "7811142279685406720",
          "subjectName": "100201 银行存款_基本户",
          "direct": 1,
          "type": "金额",
          "amount": null,
          "subject": {
            "id": "7811142279685406720",
            "companyId": "7801976694830727168",
            "createrName": "赵有文24379471",
            "createTime": 1556531658310,
            "parentId": "7811142279668629504",
            "code": "100201",
            "name": "基本户",
            "subjectCategory": "ASSETS",
            "subjectDetailCategoryKey": "CURRENT_ASSETS",
            "subjectDetailCategoryValue": "流动资产",
            "balanceDirection": "DEBIT",
            "whetherInitSubject": 1,
            "whetherLastSubject": 1,
            "whetherAuxiliary": 0,
            "whetherCount": 0,
            "unit": "",
            "whetherEnable": 1,
            "whetherFinalAdjustment": 0,
            "whetherForeignCurrency": 0,
            "currencyList": [],
            "subjectSeries": 2,
            "auxiliaryCategoryList": []
          }
        },
        {
          "id": "7811142286765391907",
          "companyId": null,
          "createrName": null,
          "createTime": null,
          "subjectId": "7811142279651852288",
          "subjectName": "1001 库存现金",
          "direct": 2,
          "type": "金额",
          "amount": null,
          "subject": {
            "id": "7811142279651852288",
            "companyId": "7801976694830727168",
            "createrName": "赵有文24379471",
            "createTime": 1556531658310,
            "parentId": "0",
            "code": "1001",
            "name": "库存现金",
            "subjectCategory": "ASSETS",
            "subjectDetailCategoryKey": "CURRENT_ASSETS",
            "subjectDetailCategoryValue": "流动资产",
            "balanceDirection": "DEBIT",
            "whetherInitSubject": 1,
            "whetherLastSubject": 1,
            "whetherAuxiliary": 0,
            "whetherCount": 0,
            "unit": "",
            "whetherEnable": 1,
            "whetherFinalAdjustment": 0,
            "whetherForeignCurrency": 0,
            "currencyList": [],
            "subjectSeries": 1,
            "auxiliaryCategoryList": []
          }
        }
      ]
    },
    {
      "id": "7811142286765391949",
      "companyId": "7801976694830727168",
      "createrName": "赵有文24379471",
      "createTime": 1556531658437,
      "type": "购进固定资产",
      "summary": "购进固定资产",
      "used": null,
      "period": null,
      "journals": [
        {
          "id": "7811142286765391908",
          "companyId": null,
          "createrName": null,
          "createTime": null,
          "subjectId": "7811142280205500416",
          "subjectName": "1601 固定资产",
          "direct": 1,
          "type": "金额",
          "amount": null,
          "subject": {
            "id": "7811142280205500416",
            "companyId": "7801976694830727168",
            "createrName": "赵有文24379471",
            "createTime": 1556531658310,
            "parentId": "0",
            "code": "1601",
            "name": "固定资产",
            "subjectCategory": "ASSETS",
            "subjectDetailCategoryKey": "UN_CURRENT_ASSETS",
            "subjectDetailCategoryValue": "非流动资产",
            "balanceDirection": "DEBIT",
            "whetherInitSubject": 1,
            "whetherLastSubject": 1,
            "whetherAuxiliary": 0,
            "whetherCount": 0,
            "unit": "",
            "whetherEnable": 1,
            "whetherFinalAdjustment": 0,
            "whetherForeignCurrency": 0,
            "currencyList": [],
            "subjectSeries": 1,
            "auxiliaryCategoryList": []
          }
        },
        {
          "id": "7811142286765391909",
          "companyId": null,
          "createrName": null,
          "createTime": null,
          "subjectId": "7811142279651852288",
          "subjectName": "1001 库存现金",
          "direct": 2,
          "type": "金额",
          "amount": null,
          "subject": {
            "id": "7811142279651852288",
            "companyId": "7801976694830727168",
            "createrName": "赵有文24379471",
            "createTime": 1556531658310,
            "parentId": "0",
            "code": "1001",
            "name": "库存现金",
            "subjectCategory": "ASSETS",
            "subjectDetailCategoryKey": "CURRENT_ASSETS",
            "subjectDetailCategoryValue": "流动资产",
            "balanceDirection": "DEBIT",
            "whetherInitSubject": 1,
            "whetherLastSubject": 1,
            "whetherAuxiliary": 0,
            "whetherCount": 0,
            "unit": "",
            "whetherEnable": 1,
            "whetherFinalAdjustment": 0,
            "whetherForeignCurrency": 0,
            "currencyList": [],
            "subjectSeries": 1,
            "auxiliaryCategoryList": []
          }
        }
      ]
    },
    {
      "id": "7811142286765391950",
      "companyId": "7801976694830727168",
      "createrName": "赵有文24379471",
      "createTime": 1556531658437,
      "type": "银行付款回单（公司）",
      "summary": "本月银行付款",
      "used": null,
      "period": null,
      "journals": [
        {
          "id": "7811142286765391910",
          "companyId": null,
          "createrName": null,
          "createTime": null,
          "subjectId": "7811142280524267520",
          "subjectName": "2202 应付账款",
          "direct": 1,
          "type": "金额",
          "amount": null,
          "subject": {
            "id": "7811142280524267520",
            "companyId": "7801976694830727168",
            "createrName": "赵有文24379471",
            "createTime": 1556531658310,
            "parentId": "0",
            "code": "2202",
            "name": "应付账款",
            "subjectCategory": "LIABILITY",
            "subjectDetailCategoryKey": "CURRENT_LIABILITY",
            "subjectDetailCategoryValue": "流动负债",
            "balanceDirection": "CREDIT",
            "whetherInitSubject": 1,
            "whetherLastSubject": 1,
            "whetherAuxiliary": 1,
            "whetherCount": 0,
            "unit": "",
            "whetherEnable": 1,
            "whetherFinalAdjustment": 0,
            "whetherForeignCurrency": 0,
            "currencyList": [],
            "subjectSeries": 1,
            "auxiliaryCategoryList": [
              {
                "id": "7811142279630880769",
                "companyId": "7801976694830727168",
                "createrName": "赵有文24379471",
                "createTime": 1556531656736,
                "name": "供应商",
                "sort": 2,
                "whetherSystem": 1
              }
            ]
          }
        },
        {
          "id": "7811142286765391911",
          "companyId": null,
          "createrName": null,
          "createTime": null,
          "subjectId": "7811142279685406720",
          "subjectName": "100201 银行存款_基本户",
          "direct": 2,
          "type": "金额",
          "amount": null,
          "subject": {
            "id": "7811142279685406720",
            "companyId": "7801976694830727168",
            "createrName": "赵有文24379471",
            "createTime": 1556531658310,
            "parentId": "7811142279668629504",
            "code": "100201",
            "name": "基本户",
            "subjectCategory": "ASSETS",
            "subjectDetailCategoryKey": "CURRENT_ASSETS",
            "subjectDetailCategoryValue": "流动资产",
            "balanceDirection": "DEBIT",
            "whetherInitSubject": 1,
            "whetherLastSubject": 1,
            "whetherAuxiliary": 0,
            "whetherCount": 0,
            "unit": "",
            "whetherEnable": 1,
            "whetherFinalAdjustment": 0,
            "whetherForeignCurrency": 0,
            "currencyList": [],
            "subjectSeries": 2,
            "auxiliaryCategoryList": []
          }
        }
      ]
    },
    {
      "id": "7811142286765391951",
      "companyId": "7801976694830727168",
      "createrName": "赵有文24379471",
      "createTime": 1556531658437,
      "type": "银行付款回单（个人）",
      "summary": "支付个人款项",
      "used": null,
      "period": null,
      "journals": [
        {
          "id": "7811142286765391912",
          "companyId": null,
          "createrName": null,
          "createTime": null,
          "subjectId": "7811142281098887168",
          "subjectName": "2241 其他应付款",
          "direct": 1,
          "type": "金额",
          "amount": null,
          "subject": {
            "id": "7811142281098887168",
            "companyId": "7801976694830727168",
            "createrName": "赵有文24379471",
            "createTime": 1556531658310,
            "parentId": "0",
            "code": "2241",
            "name": "其他应付款",
            "subjectCategory": "LIABILITY",
            "subjectDetailCategoryKey": "CURRENT_LIABILITY",
            "subjectDetailCategoryValue": "流动负债",
            "balanceDirection": "CREDIT",
            "whetherInitSubject": 1,
            "whetherLastSubject": 1,
            "whetherAuxiliary": 0,
            "whetherCount": 0,
            "unit": "",
            "whetherEnable": 1,
            "whetherFinalAdjustment": 0,
            "whetherForeignCurrency": 0,
            "currencyList": [],
            "subjectSeries": 1,
            "auxiliaryCategoryList": []
          }
        },
        {
          "id": "7811142286765391913",
          "companyId": null,
          "createrName": null,
          "createTime": null,
          "subjectId": "7811142279668629504",
          "subjectName": "1002 银行存款",
          "direct": 2,
          "type": "金额",
          "amount": null,
          "subject": {
            "id": "7811142279668629504",
            "companyId": "7801976694830727168",
            "createrName": "赵有文24379471",
            "createTime": 1556531658310,
            "parentId": "0",
            "code": "1002",
            "name": "银行存款",
            "subjectCategory": "ASSETS",
            "subjectDetailCategoryKey": "CURRENT_ASSETS",
            "subjectDetailCategoryValue": "流动资产",
            "balanceDirection": "DEBIT",
            "whetherInitSubject": 1,
            "whetherLastSubject": 0,
            "whetherAuxiliary": 0,
            "whetherCount": 0,
            "unit": "",
            "whetherEnable": 1,
            "whetherFinalAdjustment": 0,
            "whetherForeignCurrency": 0,
            "currencyList": [],
            "subjectSeries": 1,
            "auxiliaryCategoryList": []
          }
        }
      ]
    },
    {
      "id": "7811142286765391952",
      "companyId": "7801976694830727168",
      "createrName": "赵有文24379471",
      "createTime": 1556531658437,
      "type": "取现",
      "summary": "提取备用金",
      "used": null,
      "period": null,
      "journals": [
        {
          "id": "7811142286765391914",
          "companyId": null,
          "createrName": null,
          "createTime": null,
          "subjectId": "7811142279651852288",
          "subjectName": "1001 库存现金",
          "direct": 1,
          "type": "金额",
          "amount": null,
          "subject": {
            "id": "7811142279651852288",
            "companyId": "7801976694830727168",
            "createrName": "赵有文24379471",
            "createTime": 1556531658310,
            "parentId": "0",
            "code": "1001",
            "name": "库存现金",
            "subjectCategory": "ASSETS",
            "subjectDetailCategoryKey": "CURRENT_ASSETS",
            "subjectDetailCategoryValue": "流动资产",
            "balanceDirection": "DEBIT",
            "whetherInitSubject": 1,
            "whetherLastSubject": 1,
            "whetherAuxiliary": 0,
            "whetherCount": 0,
            "unit": "",
            "whetherEnable": 1,
            "whetherFinalAdjustment": 0,
            "whetherForeignCurrency": 0,
            "currencyList": [],
            "subjectSeries": 1,
            "auxiliaryCategoryList": []
          }
        },
        {
          "id": "7811142286765391915",
          "companyId": null,
          "createrName": null,
          "createTime": null,
          "subjectId": "7811142279685406720",
          "subjectName": "100201 银行存款_基本户",
          "direct": 2,
          "type": "金额",
          "amount": null,
          "subject": {
            "id": "7811142279685406720",
            "companyId": "7801976694830727168",
            "createrName": "赵有文24379471",
            "createTime": 1556531658310,
            "parentId": "7811142279668629504",
            "code": "100201",
            "name": "基本户",
            "subjectCategory": "ASSETS",
            "subjectDetailCategoryKey": "CURRENT_ASSETS",
            "subjectDetailCategoryValue": "流动资产",
            "balanceDirection": "DEBIT",
            "whetherInitSubject": 1,
            "whetherLastSubject": 1,
            "whetherAuxiliary": 0,
            "whetherCount": 0,
            "unit": "",
            "whetherEnable": 1,
            "whetherFinalAdjustment": 0,
            "whetherForeignCurrency": 0,
            "currencyList": [],
            "subjectSeries": 2,
            "auxiliaryCategoryList": []
          }
        }
      ]
    },
    {
      "id": "7811142286765391953",
      "companyId": "7801976694830727168",
      "createrName": "赵有文24379471",
      "createTime": 1556531658437,
      "type": "银行利息回单",
      "summary": "收到银行利息",
      "used": null,
      "period": null,
      "journals": [
        {
          "id": "7811142286765391916",
          "companyId": null,
          "createrName": null,
          "createTime": null,
          "subjectId": "7811142279668629504",
          "subjectName": "1002 银行存款",
          "direct": 1,
          "type": "金额",
          "amount": null,
          "subject": {
            "id": "7811142279668629504",
            "companyId": "7801976694830727168",
            "createrName": "赵有文24379471",
            "createTime": 1556531658310,
            "parentId": "0",
            "code": "1002",
            "name": "银行存款",
            "subjectCategory": "ASSETS",
            "subjectDetailCategoryKey": "CURRENT_ASSETS",
            "subjectDetailCategoryValue": "流动资产",
            "balanceDirection": "DEBIT",
            "whetherInitSubject": 1,
            "whetherLastSubject": 0,
            "whetherAuxiliary": 0,
            "whetherCount": 0,
            "unit": "",
            "whetherEnable": 1,
            "whetherFinalAdjustment": 0,
            "whetherForeignCurrency": 0,
            "currencyList": [],
            "subjectSeries": 1,
            "auxiliaryCategoryList": []
          }
        },
        {
          "id": "7811142286765391917",
          "companyId": null,
          "createrName": null,
          "createTime": null,
          "subjectId": "7811142285884588032",
          "subjectName": "560302 财务费用_利息",
          "direct": 1,
          "type": "金额",
          "amount": null,
          "subject": {
            "id": "7811142285884588032",
            "companyId": "7801976694830727168",
            "createrName": "赵有文24379471",
            "createTime": 1556531658310,
            "parentId": "7811142285846839296",
            "code": "560302",
            "name": "利息",
            "subjectCategory": "PROFIT_AND_LOSS",
            "subjectDetailCategoryKey": "PERIOD_COST",
            "subjectDetailCategoryValue": "期间费用",
            "balanceDirection": "DEBIT",
            "whetherInitSubject": 1,
            "whetherLastSubject": 1,
            "whetherAuxiliary": 0,
            "whetherCount": 0,
            "unit": "",
            "whetherEnable": 1,
            "whetherFinalAdjustment": 0,
            "whetherForeignCurrency": 0,
            "currencyList": [],
            "subjectSeries": 2,
            "auxiliaryCategoryList": []
          }
        }
      ]
    },
    {
      "id": "7811142286765391954",
      "companyId": "7801976694830727168",
      "createrName": "赵有文24379471",
      "createTime": 1556531658437,
      "type": "银行手续费回单",
      "summary": "支付银行手续费",
      "used": null,
      "period": null,
      "journals": [
        {
          "id": "7811142286765391918",
          "companyId": null,
          "createrName": null,
          "createTime": null,
          "subjectId": "7811142285897170944",
          "subjectName": "560303 财务费用_手续费",
          "direct": 1,
          "type": "金额",
          "amount": null,
          "subject": {
            "id": "7811142285897170944",
            "companyId": "7801976694830727168",
            "createrName": "赵有文24379471",
            "createTime": 1556531658310,
            "parentId": "7811142285846839296",
            "code": "560303",
            "name": "手续费",
            "subjectCategory": "PROFIT_AND_LOSS",
            "subjectDetailCategoryKey": "PERIOD_COST",
            "subjectDetailCategoryValue": "期间费用",
            "balanceDirection": "DEBIT",
            "whetherInitSubject": 1,
            "whetherLastSubject": 1,
            "whetherAuxiliary": 0,
            "whetherCount": 0,
            "unit": "",
            "whetherEnable": 1,
            "whetherFinalAdjustment": 0,
            "whetherForeignCurrency": 0,
            "currencyList": [],
            "subjectSeries": 2,
            "auxiliaryCategoryList": []
          }
        },
        {
          "id": "7811142286765391919",
          "companyId": null,
          "createrName": null,
          "createTime": null,
          "subjectId": "7811142279685406720",
          "subjectName": "100201 银行存款_基本户",
          "direct": 2,
          "type": "金额",
          "amount": null,
          "subject": {
            "id": "7811142279685406720",
            "companyId": "7801976694830727168",
            "createrName": "赵有文24379471",
            "createTime": 1556531658310,
            "parentId": "7811142279668629504",
            "code": "100201",
            "name": "基本户",
            "subjectCategory": "ASSETS",
            "subjectDetailCategoryKey": "CURRENT_ASSETS",
            "subjectDetailCategoryValue": "流动资产",
            "balanceDirection": "DEBIT",
            "whetherInitSubject": 1,
            "whetherLastSubject": 1,
            "whetherAuxiliary": 0,
            "whetherCount": 0,
            "unit": "",
            "whetherEnable": 1,
            "whetherFinalAdjustment": 0,
            "whetherForeignCurrency": 0,
            "currencyList": [],
            "subjectSeries": 2,
            "auxiliaryCategoryList": []
          }
        }
      ]
    },
    {
      "id": "7811142286765391955",
      "companyId": "7801976694830727168",
      "createrName": "赵有文24379471",
      "createTime": 1556531658437,
      "type": "购买社保",
      "summary": "交纳社保",
      "used": null,
      "period": null,
      "journals": [
        {
          "id": "7811142286765391920",
          "companyId": null,
          "createrName": null,
          "createTime": null,
          "subjectId": "7811142285771341824",
          "subjectName": "560215 管理费用_社保",
          "direct": 1,
          "type": "公司社保",
          "amount": null,
          "subject": {
            "id": "7811142285771341824",
            "companyId": "7801976694830727168",
            "createrName": "赵有文24379471",
            "createTime": 1556531658310,
            "parentId": "7811142285481934848",
            "code": "560215",
            "name": "社保",
            "subjectCategory": "PROFIT_AND_LOSS",
            "subjectDetailCategoryKey": "PERIOD_COST",
            "subjectDetailCategoryValue": "期间费用",
            "balanceDirection": "DEBIT",
            "whetherInitSubject": 1,
            "whetherLastSubject": 1,
            "whetherAuxiliary": 0,
            "whetherCount": 0,
            "unit": "",
            "whetherEnable": 1,
            "whetherFinalAdjustment": 0,
            "whetherForeignCurrency": 0,
            "currencyList": [],
            "subjectSeries": 2,
            "auxiliaryCategoryList": []
          }
        },
        {
          "id": "7811142286765391921",
          "companyId": null,
          "createrName": null,
          "createTime": null,
          "subjectId": "7811142279916093440",
          "subjectName": "122101 其他应收款_个人社保",
          "direct": 1,
          "type": "个人社保",
          "amount": null,
          "subject": {
            "id": "7811142279916093440",
            "companyId": "7801976694830727168",
            "createrName": "赵有文24379471",
            "createTime": 1556531658310,
            "parentId": "7811142279899316224",
            "code": "122101",
            "name": "个人社保",
            "subjectCategory": "ASSETS",
            "subjectDetailCategoryKey": "CURRENT_ASSETS",
            "subjectDetailCategoryValue": "流动资产",
            "balanceDirection": "DEBIT",
            "whetherInitSubject": 1,
            "whetherLastSubject": 1,
            "whetherAuxiliary": 0,
            "whetherCount": 0,
            "unit": "",
            "whetherEnable": 1,
            "whetherFinalAdjustment": 0,
            "whetherForeignCurrency": 0,
            "currencyList": [],
            "subjectSeries": 2,
            "auxiliaryCategoryList": []
          }
        },
        {
          "id": "7811142286765391922",
          "companyId": null,
          "createrName": null,
          "createTime": null,
          "subjectId": "7811142279651852288",
          "subjectName": "1001 库存现金",
          "direct": 2,
          "type": "合计金额",
          "amount": null,
          "subject": {
            "id": "7811142279651852288",
            "companyId": "7801976694830727168",
            "createrName": "赵有文24379471",
            "createTime": 1556531658310,
            "parentId": "0",
            "code": "1001",
            "name": "库存现金",
            "subjectCategory": "ASSETS",
            "subjectDetailCategoryKey": "CURRENT_ASSETS",
            "subjectDetailCategoryValue": "流动资产",
            "balanceDirection": "DEBIT",
            "whetherInitSubject": 1,
            "whetherLastSubject": 1,
            "whetherAuxiliary": 0,
            "whetherCount": 0,
            "unit": "",
            "whetherEnable": 1,
            "whetherFinalAdjustment": 0,
            "whetherForeignCurrency": 0,
            "currencyList": [],
            "subjectSeries": 1,
            "auxiliaryCategoryList": []
          }
        }
      ]
    },
    {
      "id": "7811142286765391956",
      "companyId": "7801976694830727168",
      "createrName": "赵有文24379471",
      "createTime": 1556531658437,
      "type": "购买公积金",
      "summary": "购买公积金",
      "used": null,
      "period": null,
      "journals": [
        {
          "id": "7811142286765391923",
          "companyId": null,
          "createrName": null,
          "createTime": null,
          "subjectId": "7811142285481934848",
          "subjectName": "5602 管理费用",
          "direct": 1,
          "type": "公司公积金",
          "amount": null,
          "subject": {
            "id": "7811142285481934848",
            "companyId": "7801976694830727168",
            "createrName": "赵有文24379471",
            "createTime": 1556531658310,
            "parentId": "0",
            "code": "5602",
            "name": "管理费用",
            "subjectCategory": "PROFIT_AND_LOSS",
            "subjectDetailCategoryKey": "PERIOD_COST",
            "subjectDetailCategoryValue": "期间费用",
            "balanceDirection": "DEBIT",
            "whetherInitSubject": 1,
            "whetherLastSubject": 0,
            "whetherAuxiliary": 0,
            "whetherCount": 0,
            "unit": "",
            "whetherEnable": 1,
            "whetherFinalAdjustment": 0,
            "whetherForeignCurrency": 0,
            "currencyList": [],
            "subjectSeries": 1,
            "auxiliaryCategoryList": []
          }
        },
        {
          "id": "7811142286765391924",
          "companyId": null,
          "createrName": null,
          "createTime": null,
          "subjectId": "7811142279899316224",
          "subjectName": "1221 其他应收款",
          "direct": 1,
          "type": "个人公积金",
          "amount": null,
          "subject": {
            "id": "7811142279899316224",
            "companyId": "7801976694830727168",
            "createrName": "赵有文24379471",
            "createTime": 1556531658310,
            "parentId": "0",
            "code": "1221",
            "name": "其他应收款",
            "subjectCategory": "ASSETS",
            "subjectDetailCategoryKey": "CURRENT_ASSETS",
            "subjectDetailCategoryValue": "流动资产",
            "balanceDirection": "DEBIT",
            "whetherInitSubject": 1,
            "whetherLastSubject": 0,
            "whetherAuxiliary": 0,
            "whetherCount": 0,
            "unit": "",
            "whetherEnable": 1,
            "whetherFinalAdjustment": 0,
            "whetherForeignCurrency": 0,
            "currencyList": [],
            "subjectSeries": 1,
            "auxiliaryCategoryList": []
          }
        },
        {
          "id": "7811142286765391925",
          "companyId": null,
          "createrName": null,
          "createTime": null,
          "subjectId": "7811142279668629504",
          "subjectName": "1002 银行存款",
          "direct": 2,
          "type": "合计金额",
          "amount": null,
          "subject": {
            "id": "7811142279668629504",
            "companyId": "7801976694830727168",
            "createrName": "赵有文24379471",
            "createTime": 1556531658310,
            "parentId": "0",
            "code": "1002",
            "name": "银行存款",
            "subjectCategory": "ASSETS",
            "subjectDetailCategoryKey": "CURRENT_ASSETS",
            "subjectDetailCategoryValue": "流动资产",
            "balanceDirection": "DEBIT",
            "whetherInitSubject": 1,
            "whetherLastSubject": 0,
            "whetherAuxiliary": 0,
            "whetherCount": 0,
            "unit": "",
            "whetherEnable": 1,
            "whetherFinalAdjustment": 0,
            "whetherForeignCurrency": 0,
            "currencyList": [],
            "subjectSeries": 1,
            "auxiliaryCategoryList": []
          }
        }
      ]
    },
    {
      "id": "7811142286765391957",
      "companyId": "7801976694830727168",
      "createrName": "赵有文24379471",
      "createTime": 1556531658437,
      "type": "费用票据",
      "summary": "费用",
      "used": null,
      "period": null,
      "journals": [
        {
          "id": "7811142286765391926",
          "companyId": null,
          "createrName": null,
          "createTime": null,
          "subjectId": "7811142285519683584",
          "subjectName": "560202 管理费用_福利费",
          "direct": 1,
          "type": "福利费",
          "amount": null,
          "subject": {
            "id": "7811142285519683584",
            "companyId": "7801976694830727168",
            "createrName": "赵有文24379471",
            "createTime": 1556531658310,
            "parentId": "7811142285481934848",
            "code": "560202",
            "name": "福利费",
            "subjectCategory": "PROFIT_AND_LOSS",
            "subjectDetailCategoryKey": "PERIOD_COST",
            "subjectDetailCategoryValue": "期间费用",
            "balanceDirection": "DEBIT",
            "whetherInitSubject": 1,
            "whetherLastSubject": 1,
            "whetherAuxiliary": 0,
            "whetherCount": 0,
            "unit": "",
            "whetherEnable": 1,
            "whetherFinalAdjustment": 0,
            "whetherForeignCurrency": 0,
            "currencyList": [],
            "subjectSeries": 2,
            "auxiliaryCategoryList": []
          }
        },
        {
          "id": "7811142286765391927",
          "companyId": null,
          "createrName": null,
          "createTime": null,
          "subjectId": "7811142285561626624",
          "subjectName": "560204 管理费用_业务招待费",
          "direct": 1,
          "type": "业务招待费",
          "amount": null,
          "subject": {
            "id": "7811142285561626624",
            "companyId": "7801976694830727168",
            "createrName": "赵有文24379471",
            "createTime": 1556531658310,
            "parentId": "7811142285481934848",
            "code": "560204",
            "name": "业务招待费",
            "subjectCategory": "PROFIT_AND_LOSS",
            "subjectDetailCategoryKey": "PERIOD_COST",
            "subjectDetailCategoryValue": "期间费用",
            "balanceDirection": "DEBIT",
            "whetherInitSubject": 1,
            "whetherLastSubject": 1,
            "whetherAuxiliary": 0,
            "whetherCount": 0,
            "unit": "",
            "whetherEnable": 1,
            "whetherFinalAdjustment": 0,
            "whetherForeignCurrency": 0,
            "currencyList": [],
            "subjectSeries": 2,
            "auxiliaryCategoryList": []
          }
        },
        {
          "id": "7811142286765391928",
          "companyId": null,
          "createrName": null,
          "createTime": null,
          "subjectId": "7811142285637124096",
          "subjectName": "560208 管理费用_通讯费",
          "direct": 1,
          "type": "通讯费",
          "amount": null,
          "subject": {
            "id": "7811142285637124096",
            "companyId": "7801976694830727168",
            "createrName": "赵有文24379471",
            "createTime": 1556531658310,
            "parentId": "7811142285481934848",
            "code": "560208",
            "name": "通讯费",
            "subjectCategory": "PROFIT_AND_LOSS",
            "subjectDetailCategoryKey": "PERIOD_COST",
            "subjectDetailCategoryValue": "期间费用",
            "balanceDirection": "DEBIT",
            "whetherInitSubject": 1,
            "whetherLastSubject": 1,
            "whetherAuxiliary": 0,
            "whetherCount": 0,
            "unit": "",
            "whetherEnable": 1,
            "whetherFinalAdjustment": 0,
            "whetherForeignCurrency": 0,
            "currencyList": [],
            "subjectSeries": 2,
            "auxiliaryCategoryList": []
          }
        },
        {
          "id": "7811142286765391929",
          "companyId": null,
          "createrName": null,
          "createTime": null,
          "subjectId": "7811142285616152576",
          "subjectName": "560207 管理费用_差旅费",
          "direct": 1,
          "type": "差旅费",
          "amount": null,
          "subject": {
            "id": "7811142285616152576",
            "companyId": "7801976694830727168",
            "createrName": "赵有文24379471",
            "createTime": 1556531658310,
            "parentId": "7811142285481934848",
            "code": "560207",
            "name": "差旅费",
            "subjectCategory": "PROFIT_AND_LOSS",
            "subjectDetailCategoryKey": "PERIOD_COST",
            "subjectDetailCategoryValue": "期间费用",
            "balanceDirection": "DEBIT",
            "whetherInitSubject": 1,
            "whetherLastSubject": 1,
            "whetherAuxiliary": 0,
            "whetherCount": 0,
            "unit": "",
            "whetherEnable": 1,
            "whetherFinalAdjustment": 0,
            "whetherForeignCurrency": 0,
            "currencyList": [],
            "subjectSeries": 2,
            "auxiliaryCategoryList": []
          }
        },
        {
          "id": "7811142286765391930",
          "companyId": null,
          "createrName": null,
          "createTime": null,
          "subjectId": "7811142285578403840",
          "subjectName": "560205 管理费用_交通费",
          "direct": 1,
          "type": "交通费",
          "amount": null,
          "subject": {
            "id": "7811142285578403840",
            "companyId": "7801976694830727168",
            "createrName": "赵有文24379471",
            "createTime": 1556531658310,
            "parentId": "7811142285481934848",
            "code": "560205",
            "name": "交通费",
            "subjectCategory": "PROFIT_AND_LOSS",
            "subjectDetailCategoryKey": "PERIOD_COST",
            "subjectDetailCategoryValue": "期间费用",
            "balanceDirection": "DEBIT",
            "whetherInitSubject": 1,
            "whetherLastSubject": 1,
            "whetherAuxiliary": 0,
            "whetherCount": 0,
            "unit": "",
            "whetherEnable": 1,
            "whetherFinalAdjustment": 0,
            "whetherForeignCurrency": 0,
            "currencyList": [],
            "subjectSeries": 2,
            "auxiliaryCategoryList": []
          }
        },
        {
          "id": "7811142286765391931",
          "companyId": null,
          "createrName": null,
          "createTime": null,
          "subjectId": "7811142285825867776",
          "subjectName": "560299 管理费用_其他",
          "direct": 1,
          "type": "其他",
          "amount": null,
          "subject": {
            "id": "7811142285825867776",
            "companyId": "7801976694830727168",
            "createrName": "赵有文24379471",
            "createTime": 1556531658310,
            "parentId": "7811142285481934848",
            "code": "560299",
            "name": "其他",
            "subjectCategory": "PROFIT_AND_LOSS",
            "subjectDetailCategoryKey": "PERIOD_COST",
            "subjectDetailCategoryValue": "期间费用",
            "balanceDirection": "DEBIT",
            "whetherInitSubject": 1,
            "whetherLastSubject": 1,
            "whetherAuxiliary": 0,
            "whetherCount": 0,
            "unit": "",
            "whetherEnable": 1,
            "whetherFinalAdjustment": 0,
            "whetherForeignCurrency": 0,
            "currencyList": [],
            "subjectSeries": 2,
            "auxiliaryCategoryList": []
          }
        },
        {
          "id": "7811142286765391932",
          "companyId": null,
          "createrName": null,
          "createTime": null,
          "subjectId": "7811142279651852288",
          "subjectName": "1001 库存现金",
          "direct": 2,
          "type": "合计金额",
          "amount": null,
          "subject": {
            "id": "7811142279651852288",
            "companyId": "7801976694830727168",
            "createrName": "赵有文24379471",
            "createTime": 1556531658310,
            "parentId": "0",
            "code": "1001",
            "name": "库存现金",
            "subjectCategory": "ASSETS",
            "subjectDetailCategoryKey": "CURRENT_ASSETS",
            "subjectDetailCategoryValue": "流动资产",
            "balanceDirection": "DEBIT",
            "whetherInitSubject": 1,
            "whetherLastSubject": 1,
            "whetherAuxiliary": 0,
            "whetherCount": 0,
            "unit": "",
            "whetherEnable": 1,
            "whetherFinalAdjustment": 0,
            "whetherForeignCurrency": 0,
            "currencyList": [],
            "subjectSeries": 1,
            "auxiliaryCategoryList": []
          }
        }
      ]
    },
    {
      "id": "7811142286765391958",
      "companyId": "7801976694830727168",
      "createrName": "赵有文24379471",
      "createTime": 1556531658437,
      "type": "服务成本（普票）",
      "summary": "服务成本",
      "used": null,
      "period": null,
      "journals": [
        {
          "id": "7811142286765391933",
          "companyId": null,
          "createrName": null,
          "createTime": null,
          "subjectId": "7811142281870639104",
          "subjectName": "5401 主营业务成本",
          "direct": 1,
          "type": "金额",
          "amount": null,
          "subject": {
            "id": "7811142281870639104",
            "companyId": "7801976694830727168",
            "createrName": "赵有文24379471",
            "createTime": 1556531658310,
            "parentId": "0",
            "code": "5401",
            "name": "主营业务成本",
            "subjectCategory": "PROFIT_AND_LOSS",
            "subjectDetailCategoryKey": "OPERATING_COSTS_AND_TAXES",
            "subjectDetailCategoryValue": "营业成本及税金",
            "balanceDirection": "DEBIT",
            "whetherInitSubject": 1,
            "whetherLastSubject": 1,
            "whetherAuxiliary": 0,
            "whetherCount": 0,
            "unit": "",
            "whetherEnable": 1,
            "whetherFinalAdjustment": 0,
            "whetherForeignCurrency": 0,
            "currencyList": [],
            "subjectSeries": 1,
            "auxiliaryCategoryList": []
          }
        },
        {
          "id": "7811142286765391934",
          "companyId": null,
          "createrName": null,
          "createTime": null,
          "subjectId": "7811142280524267520",
          "subjectName": "2202 应付账款",
          "direct": 2,
          "type": "金额",
          "amount": null,
          "subject": {
            "id": "7811142280524267520",
            "companyId": "7801976694830727168",
            "createrName": "赵有文24379471",
            "createTime": 1556531658310,
            "parentId": "0",
            "code": "2202",
            "name": "应付账款",
            "subjectCategory": "LIABILITY",
            "subjectDetailCategoryKey": "CURRENT_LIABILITY",
            "subjectDetailCategoryValue": "流动负债",
            "balanceDirection": "CREDIT",
            "whetherInitSubject": 1,
            "whetherLastSubject": 1,
            "whetherAuxiliary": 1,
            "whetherCount": 0,
            "unit": "",
            "whetherEnable": 1,
            "whetherFinalAdjustment": 0,
            "whetherForeignCurrency": 0,
            "currencyList": [],
            "subjectSeries": 1,
            "auxiliaryCategoryList": [
              {
                "id": "7811142279630880769",
                "companyId": "7801976694830727168",
                "createrName": "赵有文24379471",
                "createTime": 1556531656736,
                "name": "供应商",
                "sort": 2,
                "whetherSystem": 1
              }
            ]
          }
        }
      ]
    },
    {
      "id": "7811142286765391959",
      "companyId": "7801976694830727168",
      "createrName": "赵有文24379471",
      "createTime": 1556531658437,
      "type": "人员工资单",
      "summary": "test2",
      "used": null,
      "period": null,
      "journals": [
        {
          "id": "7811142286765391936",
          "companyId": null,
          "createrName": null,
          "createTime": null,
          "subjectId": "7811142279651852288",
          "subjectName": "1001 库存现金",
          "direct": 2,
          "type": "金额",
          "amount": null,
          "subject": {
            "id": "7811142279651852288",
            "companyId": "7801976694830727168",
            "createrName": "赵有文24379471",
            "createTime": 1556531658310,
            "parentId": "0",
            "code": "1001",
            "name": "库存现金",
            "subjectCategory": "ASSETS",
            "subjectDetailCategoryKey": "CURRENT_ASSETS",
            "subjectDetailCategoryValue": "流动资产",
            "balanceDirection": "DEBIT",
            "whetherInitSubject": 1,
            "whetherLastSubject": 1,
            "whetherAuxiliary": 0,
            "whetherCount": 0,
            "unit": "",
            "whetherEnable": 1,
            "whetherFinalAdjustment": 0,
            "whetherForeignCurrency": 0,
            "currencyList": [],
            "subjectSeries": 1,
            "auxiliaryCategoryList": []
          }
        }
      ]
    },
    {
      "id": "7811142286765391960",
      "companyId": "7801976694830727168",
      "createrName": "赵有文24379471",
      "createTime": 1556531658437,
      "type": "其他类型",
      "summary": "test",
      "used": null,
      "period": null,
      "journals": [
        {
          "id": "7811512006369148928",
          "companyId": null,
          "createrName": null,
          "createTime": null,
          "subjectId": "7811142279651852288",
          "subjectName": "1001 库存现金",
          "direct": 1,
          "type": "金额",
          "amount": null,
          "subject": {
            "id": "7811142279651852288",
            "companyId": "7801976694830727168",
            "createrName": "赵有文24379471",
            "createTime": 1556531658310,
            "parentId": "0",
            "code": "1001",
            "name": "库存现金",
            "subjectCategory": "ASSETS",
            "subjectDetailCategoryKey": "CURRENT_ASSETS",
            "subjectDetailCategoryValue": "流动资产",
            "balanceDirection": "DEBIT",
            "whetherInitSubject": 1,
            "whetherLastSubject": 1,
            "whetherAuxiliary": 0,
            "whetherCount": 0,
            "unit": "",
            "whetherEnable": 1,
            "whetherFinalAdjustment": 0,
            "whetherForeignCurrency": 0,
            "currencyList": [],
            "subjectSeries": 1,
            "auxiliaryCategoryList": []
          }
        }
      ]
    }
  ];

  let billList = [
    {
      "id": "7811404284016828416",
      "companyId": "7801976694830727168",
      "createrName": "赵有文24379471",
      "createTime": 1556594123450,
      "no": "20190412112655",
      "imageUrl": "https://testdggoss1.oss-cn-beijing.aliyuncs.com/20190412112655.jpg",
      "info": {
        "id": "7811142286765391960",
        "companyId": "7801976694830727168",
        "createrName": "赵有文24379471",
        "createTime": 1556531658437,
        "type": "其他类型",
        "summary": "test",
        "used": true,
        "period": null,
        "journals": [
          {
            "id": "7811512006369148928",
            "companyId": null,
            "createrName": null,
            "createTime": null,
            "subjectId": "7811142279651852288",
            "subjectName": "1001 库存现金",
            "direct": 1,
            "type": "金额",
            "amount": 900,
            "subject": {
              "balanceDirection": "DEBIT",
              "whetherAuxiliary": 0,
              "whetherEnable": 1,
              "code": "1001",
              "auxiliaryCategoryList": [],
              "currencyList": [],
              "whetherForeignCurrency": 0,
              "subjectDetailCategoryValue": "流动资产",
              "subjectSeries": 1,
              "createrName": "赵有文24379471",
              "parentId": "0",
              "whetherCount": 0,
              "subjectCategory": "ASSETS",
              "companyId": "7801976694830727168",
              "unit": "",
              "whetherInitSubject": 1,
              "createTime": "1556531658310",
              "whetherLastSubject": 1,
              "name": "库存现金",
              "id": "7811142279651852288",
              "subjectDetailCategoryKey": "CURRENT_ASSETS",
              "whetherFinalAdjustment": 0
            }
          }
        ]
      },
      "period": 201901,
      "date": "2019-01-31",
      "state": 1,
      "accounted": 1,
      "spaned": 2,
      "associatedVoucherId": null,
      "associatedVoucherNo": null,
      "group": null,
      "groupSort": 2147483647,
      "groupLevel": null,
      "returnNote": null,
      "spanNote": null,
      "auditState": "审核通过"
    },
    {
      "id": "7811404283983273984",
      "companyId": "7801976694830727168",
      "createrName": "赵有文24379471",
      "createTime": 1556594123442,
      "no": "20190412112220",
      "imageUrl": "https://testdggoss1.oss-cn-beijing.aliyuncs.com/20190412112220.jpg",
      "info": {
        "id": "7811142286765391959",
        "companyId": "7801976694830727168",
        "createrName": "赵有文24379471",
        "createTime": 1556531658437,
        "type": "人员工资单",
        "summary": "test2",
        "used": true,
        "period": null,
        "journals": [
          {
            "id": "7811142286765391936",
            "companyId": null,
            "createrName": null,
            "createTime": null,
            "subjectId": "7811142279651852288",
            "subjectName": "1001 库存现金",
            "direct": 2,
            "type": "金额",
            "amount": 450,
            "subject": {
              "balanceDirection": "DEBIT",
              "whetherAuxiliary": 0,
              "whetherEnable": 1,
              "code": "1001",
              "auxiliaryCategoryList": [],
              "currencyList": [],
              "whetherForeignCurrency": 0,
              "subjectDetailCategoryValue": "流动资产",
              "subjectSeries": 1,
              "createrName": "赵有文24379471",
              "parentId": "0",
              "whetherCount": 0,
              "subjectCategory": "ASSETS",
              "companyId": "7801976694830727168",
              "unit": "",
              "whetherInitSubject": 1,
              "createTime": "1556531658310",
              "whetherLastSubject": 1,
              "name": "库存现金",
              "id": "7811142279651852288",
              "subjectDetailCategoryKey": "CURRENT_ASSETS",
              "whetherFinalAdjustment": 0
            }
          }
        ]
      },
      "period": 201901,
      "date": "2019-01-31",
      "state": 1,
      "accounted": 1,
      "spaned": 2,
      "associatedVoucherId": null,
      "associatedVoucherNo": null,
      "group": null,
      "groupSort": 2147483647,
      "groupLevel": null,
      "returnNote": null,
      "spanNote": null,
      "auditState": "审核通过"
    },
    {
      "id": "7811404283949719552",
      "companyId": "7801976694830727168",
      "createrName": "赵有文24379471",
      "createTime": 1556594123434,
      "no": "20190412112211",
      "imageUrl": "https://testdggoss1.oss-cn-beijing.aliyuncs.com/20190412112211.jpg",
      "info": {
        "id": "7811142286765391937",
        "companyId": "7801976694830727168",
        "createrName": "赵有文24379471",
        "createTime": 1556531658437,
        "type": "增值税专用发票（收入）",
        "summary": "收入",
        "used": null,
        "period": null,
        "journals": [
          {
            "id": "7811142286765391872",
            "companyId": null,
            "createrName": null,
            "createTime": null,
            "subjectId": "7811142279828013056",
            "subjectName": "1122 应收账款",
            "direct": 1,
            "type": "合计金额",
            "amount": null,
            "subject": {
              "id": "7811142279828013056",
              "companyId": "7801976694830727168",
              "createrName": "赵有文24379471",
              "createTime": 1556531658310,
              "parentId": "0",
              "code": "1122",
              "name": "应收账款",
              "subjectCategory": "ASSETS",
              "subjectDetailCategoryKey": "CURRENT_ASSETS",
              "subjectDetailCategoryValue": "流动资产",
              "balanceDirection": "DEBIT",
              "whetherInitSubject": 1,
              "whetherLastSubject": 1,
              "whetherAuxiliary": 1,
              "whetherCount": 0,
              "unit": "",
              "whetherEnable": 1,
              "whetherFinalAdjustment": 0,
              "whetherForeignCurrency": 0,
              "currencyList": [],
              "subjectSeries": 1,
              "auxiliaryCategoryList": [
                {
                  "id": "7811142279630880768",
                  "companyId": "7801976694830727168",
                  "createrName": "赵有文24379471",
                  "createTime": 1556531656736,
                  "name": "客户",
                  "sort": 1,
                  "whetherSystem": 1
                }
              ]
            }
          },
          {
            "id": "7811142286765391873",
            "companyId": null,
            "createrName": null,
            "createTime": null,
            "subjectId": "7811142281652535296",
            "subjectName": "5001 主营业务收入",
            "direct": 2,
            "type": "金额",
            "amount": null,
            "subject": {
              "id": "7811142281652535296",
              "companyId": "7801976694830727168",
              "createrName": "赵有文24379471",
              "createTime": 1556531658310,
              "parentId": "0",
              "code": "5001",
              "name": "主营业务收入",
              "subjectCategory": "PROFIT_AND_LOSS",
              "subjectDetailCategoryKey": "BUSINESS_INCOME",
              "subjectDetailCategoryValue": "营业收入",
              "balanceDirection": "CREDIT",
              "whetherInitSubject": 1,
              "whetherLastSubject": 1,
              "whetherAuxiliary": 0,
              "whetherCount": 0,
              "unit": "",
              "whetherEnable": 1,
              "whetherFinalAdjustment": 0,
              "whetherForeignCurrency": 0,
              "currencyList": [],
              "subjectSeries": 1,
              "auxiliaryCategoryList": []
            }
          },
          {
            "id": "7811142286765391874",
            "companyId": null,
            "createrName": null,
            "createTime": null,
            "subjectId": "7811142280721399808",
            "subjectName": "22210106 应交税费_应交增值税_销项税额",
            "direct": 2,
            "type": "税额",
            "amount": null,
            "subject": {
              "id": "7811142280721399808",
              "companyId": "7801976694830727168",
              "createrName": "赵有文24379471",
              "createTime": 1556531658310,
              "parentId": "7811142280608153600",
              "code": "22210106",
              "name": "销项税额",
              "subjectCategory": "LIABILITY",
              "subjectDetailCategoryKey": "CURRENT_LIABILITY",
              "subjectDetailCategoryValue": "流动负债",
              "balanceDirection": "CREDIT",
              "whetherInitSubject": 1,
              "whetherLastSubject": 1,
              "whetherAuxiliary": 0,
              "whetherCount": 0,
              "unit": "",
              "whetherEnable": 1,
              "whetherFinalAdjustment": 0,
              "whetherForeignCurrency": 0,
              "currencyList": [],
              "subjectSeries": 3,
              "auxiliaryCategoryList": []
            }
          }
        ]
      },
      "period": 201901,
      "date": "2019-01-31",
      "state": 1,
      "accounted": 1,
      "spaned": 2,
      "associatedVoucherId": null,
      "associatedVoucherNo": null,
      "group": null,
      "groupSort": 2147483647,
      "groupLevel": null,
      "returnNote": null,
      "spanNote": null,
      "auditState": "审核通过"
    },
    {
      "id": "7811404283907776512",
      "companyId": "7801976694830727168",
      "createrName": "赵有文24379471",
      "createTime": 1556594123424,
      "no": "201903115",
      "imageUrl": "https://testdggoss1.oss-cn-beijing.aliyuncs.com/201903115.jpg",
      "info": {
        "id": "7811142286765391937",
        "companyId": "7801976694830727168",
        "createrName": "赵有文24379471",
        "createTime": 1556531658437,
        "type": "增值税专用发票（收入）",
        "summary": "收入",
        "used": true,
        "period": null,
        "journals": [
          {
            "id": "7811142286765391872",
            "companyId": null,
            "createrName": null,
            "createTime": null,
            "subjectId": "7811142279828013056",
            "subjectName": "1122 应收账款",
            "direct": 1,
            "type": "合计金额",
            "amount": 3,
            "subject": {
              "balanceDirection": "DEBIT",
              "whetherAuxiliary": 1,
              "whetherEnable": 1,
              "code": "1122",
              "auxiliaryCategoryList": [
                {
                  "companyId": "7801976694830727168",
                  "whetherSystem": 1,
                  "createTime": "1556531656736",
                  "name": "客户",
                  "id": "7811142279630880768",
                  "sort": 1,
                  "createrName": "赵有文24379471"
                }
              ],
              "currencyList": [],
              "whetherForeignCurrency": 0,
              "subjectDetailCategoryValue": "流动资产",
              "subjectSeries": 1,
              "createrName": "赵有文24379471",
              "parentId": "0",
              "whetherCount": 0,
              "subjectCategory": "ASSETS",
              "companyId": "7801976694830727168",
              "unit": "",
              "whetherInitSubject": 1,
              "createTime": "1556531658310",
              "whetherLastSubject": 1,
              "name": "应收账款",
              "id": "7811142279828013056",
              "subjectDetailCategoryKey": "CURRENT_ASSETS",
              "whetherFinalAdjustment": 0
            }
          },
          {
            "id": "7811142286765391873",
            "companyId": null,
            "createrName": null,
            "createTime": null,
            "subjectId": "7811142281652535296",
            "subjectName": "5001 主营业务收入",
            "direct": 2,
            "type": "金额",
            "amount": 2,
            "subject": {
              "balanceDirection": "CREDIT",
              "whetherAuxiliary": 0,
              "whetherEnable": 1,
              "code": "5001",
              "auxiliaryCategoryList": [],
              "currencyList": [],
              "whetherForeignCurrency": 0,
              "subjectDetailCategoryValue": "营业收入",
              "subjectSeries": 1,
              "createrName": "赵有文24379471",
              "parentId": "0",
              "whetherCount": 0,
              "subjectCategory": "PROFIT_AND_LOSS",
              "companyId": "7801976694830727168",
              "unit": "",
              "whetherInitSubject": 1,
              "createTime": "1556531658310",
              "whetherLastSubject": 1,
              "name": "主营业务收入",
              "id": "7811142281652535296",
              "subjectDetailCategoryKey": "BUSINESS_INCOME",
              "whetherFinalAdjustment": 0
            }
          },
          {
            "id": "7811142286765391874",
            "companyId": null,
            "createrName": null,
            "createTime": null,
            "subjectId": "7811142280721399808",
            "subjectName": "22210106 应交税费_应交增值税_销项税额",
            "direct": 2,
            "type": "税额",
            "amount": 1,
            "subject": {
              "balanceDirection": "CREDIT",
              "whetherAuxiliary": 0,
              "whetherEnable": 1,
              "code": "22210106",
              "auxiliaryCategoryList": [],
              "currencyList": [],
              "whetherForeignCurrency": 0,
              "subjectDetailCategoryValue": "流动负债",
              "subjectSeries": 3,
              "createrName": "赵有文24379471",
              "parentId": "7811142280608153600",
              "whetherCount": 0,
              "subjectCategory": "LIABILITY",
              "companyId": "7801976694830727168",
              "unit": "",
              "whetherInitSubject": 1,
              "createTime": "1556531658310",
              "whetherLastSubject": 1,
              "name": "销项税额",
              "id": "7811142280721399808",
              "subjectDetailCategoryKey": "CURRENT_LIABILITY",
              "whetherFinalAdjustment": 0
            }
          }
        ]
      },
      "period": 201901,
      "date": "2019-01-31",
      "state": 1,
      "accounted": 1,
      "spaned": 2,
      "associatedVoucherId": null,
      "associatedVoucherNo": null,
      "group": null,
      "groupSort": 2147483647,
      "groupLevel": null,
      "returnNote": null,
      "spanNote": null,
      "auditState": "审核通过"
    }
  ];
</script>

<style scoped>

</style>

sap.ui.define([
	"sap/ui/core/mvc/Controller",
    "sap/m/MessageBox"
],
	/**
	 * @param {typeof sap.ui.core.mvc.Controller} Controller
	 */
	function (Controller, MessageBox) {
		"use strict";

		return Controller.extend("com.demo.pcm.partnerregistration2.controller.PartnerRegistration", {
			serviceUrl: null,
            siteID: null,
            currentPage: 0,
            Model: null,
            oDataModel: null,
            step1ValidationFields: [],
            resourceBundle: null,
            lastDisabledCheckbox: null,
            isFirstTime: true,
            steps: ["BecomeAPartner", "CompanyInformation", "ContactInformation", "AdditionalInformation"],
        
			onInit: function () {

                this.getView().byId("backBtn").setVisible(false);
                this.Model = new sap.ui.model.json.JSONModel();

                this.serviceUrl = ""; //this.getServiceUrl(window.generalNameSpace.businessObject.oDataService);
                // this.oDataModel = new sap.ui.model.odata.ODataModel(this.serviceUrl);
                this.oDataModel = this.getOwnerComponent().getModel();

                // if (this.oDataModel.sServiceUrl !== this.serviceUrl) {
                //     this.oDataModel.sServiceUrl = this.serviceUrl;
                // }

                this.getPartnerPrograms(function(data){
                    this.Model.setProperty("/partnerPrograms",data);
                    this.createPartnerFormButtons(data, "partnerProgram", 1);
                }.bind(this));

                this.getPartnerTypes(function(data){
                    this.Model.setProperty("/partnerTypes",data);
                    this.createPartnerFormButtons(data, "partnerType", 2);
                }.bind(this));

                this.getCountries(function(data){
                    this.Model.setProperty("/countries",data);
                }.bind(this));

                this.getLanguage(function(data){
                    this.Model.setProperty("/language",data);
                }.bind(this));

                this.getSalutation(function(data){
                    this.Model.setProperty("/PartnerContactSalutation",data);
                }.bind(this));


                this.getMainIndustry(function(data){
                    this.Model.setProperty("/industries",data);
                    this.createIndustriesCheckBox(data);
                }.bind(this));

                this.Model.setProperty("/PartnerData",{
                    PartnerProgramCode: "", PartnerTypeCode: "",
                    CompanyName: "", Address: "", City: "", Country: "", PostalCode: "", CompanyPhone: "", CompanyEmail: "", CompanyWebAddress: "", PrimaryCommunicationLanguage: "", VatRegistrationNumber: "", DUNSNumber: "",
                    PartnerContactSalutation: "", PartnerContactJobTitle: "", PartnerContactPreferredLanguage: "", PartnerContactFirstName: "", PartnerContactLastName: "", PartnerContactEmail: "", PartnerContactPhone: "", AddressIndicator: false, PartnerContactPostalCode: "", PartnerContactAddress: "", PartnerContactCountry: "", PartnerContactCity: "",
                    mainIndustry: "", PartnerOnboardingIndustry: "", PartnerOnboardingText: "", YearFounded: "", NumberOfCustomers: "", NumberOfEmployees: ""
                });

                this.Model.setSizeLimit(260);
                this.getView().setModel(this.Model);
                this.resourceBundle = this.loadBundle();

                this.setPartnerPersonalDetails();

                try {
                    this.disableCheckBox(null);
                }catch(err){
                    //do nothing
                }
            
            },

            createPartnerFormButtons: function(data, buttonsID, numberOfColumns){

                var rButtonsGroup = new sap.m.RadioButtonGroup(buttonsID, {
                    columns: numberOfColumns
                });

                jQuery.each(data, function(index, partnerData){
                    var btn = new sap.m.RadioButton("RB-" + partnerData.Code,{
                        text: partnerData.Description
                    });

                    var customData = new sap.ui.core.CustomData({key: "CODE", value: partnerData.Code});
                    btn.addCustomData(customData);
                    rButtonsGroup.addButton(btn);
                });

                var vBox = this.getView().byId(buttonsID + "Info");
                vBox.addItem(rButtonsGroup);
            },


            wizardSelectTab: function(oEvent) {
                var pageKey = this.steps[this.currentPage];
                oEvent.getSource().setSelectedKey(pageKey);
                return false;
            },
            
            loadBundle: function(){
                // Load resource Bundle
                return this.getOwnerComponent().getModel("i18n").getResourceBundle();
            },

            back: function(){
                if (this.currentPage > 0){
                    this.currentPage--;
                    var pageKey = this.steps[this.currentPage];
                    if (pageKey === "ContactInformation") {
                        this.getView().byId("next_submit").setText("Next");
                    }

                    if (pageKey === "BecomeAPartner"){
                        this.getView().byId("backBtn").setVisible(false);
                    }

                    this.getView().byId("wizardTabBar").setSelectedKey(pageKey);
                    this.getView().byId("wizardContent").back();
                    jQuery('.RemoveFade').removeClass('RemoveFade');
                }
            },
            next: function(){
                if (this.currentPage < (this.steps.length - 1)) {
                    var shouldContinue = true;
                    this.currentPage++;
                    var pageKey = this.steps[this.currentPage];
                    if (pageKey === "CompanyInformation"){
                        this.getView().byId("backBtn").setVisible(true);
                    }
                    if (pageKey === "ContactInformation") {
                        shouldContinue = this.validateStep1();
                    }
                    if (pageKey === "AdditionalInformation") {
                        shouldContinue = this.validateStep2();
                        if (shouldContinue) {
                            this.getView().byId("next_submit").setText("Submit");
                        }
                    }

                    if (shouldContinue){
                        this.goTo(this.steps[this.currentPage]);
                        this.getView().byId("wizardTabBar").setSelectedKey(pageKey);
                    } else {
                        this.currentPage--;
                        return;
                    }
                } else {
                    this.getView().byId("next_submit").setText("Submit");
                    // this is used to validate the data entered
                    if (this.validateStep3()) {
                        this.submitData();
                    }
                }
                jQuery('.RemoveFade').removeClass('RemoveFade');
            },

            goTo: function(target){
                this.getView().byId("wizardContent").to(this.getView().byId(target + "Page"), "slide");
            },

            handleNavButtonPress: function(){
                window.history.back();
            },

            getPartnerPrograms: function(callback){
                this.getAjax(this.serviceUrl + "/" + "PartnerOnboardingRequestPartnerProgramCodeCollection?$format=json", callback);
            },

            getPartnerTypes: function(callback){
                this.getAjax(this.serviceUrl + "/" + "PartnerOnboardingRequestPartnerTypeCodeCollection?$format=json", callback);
            },

            getCountries: function(callback){
                this.getAjax(this.serviceUrl + "/" + "PartnerOnboardingRequestCountryCollection?$format=json", callback);
            },

            getSalutation: function(callback){
                this.getAjax(this.serviceUrl + "/" + "PartnerOnboardingRequestPartnerContactSalutationCollection?$format=json", callback);
            },

            getLanguage: function(callback){
                var queryApi = this.serviceUrl + "/" + "PartnerOnboardingRequestPartnerContactPreferredLanguageCollection?$format=json";
                this.getAjax(queryApi, callback);
            },

            getAjax: function(queryApi, callback){
                this.oDataModel && this.oDataModel.read(queryApi, {
                    success: function(oData, response) {
                        console.log(oData, response);
                        if (oData && oData.results) {
                            callback(oData.results);
                        } else {
                            callback([]);
                        }
                    }.bind(this),
                    error: function(err) {
                        callback([])
                    }.bind(this)
                });
            },

            getMainIndustry: function(callback){
                callback(this.getIndustriesDropDown());
            },

            getIndustriesDropDown: function(){
                var industriesModel = [
                    {Industry: "Agriculture, forestry, fishing and hunting", code: "11"},
                    {Industry: "Mining", code: "21"},
                    {Industry: "Utilities", code: "22"},
                    {Industry: "Construction", code: "23"},
                    {Industry: "Manufacturing", code: "31"},
                    {Industry: "Wholesale trade", code: "42"},
                    {Industry: "Retail trade", code: "44"},
                    {Industry: "Transportation and warehousing", code: "48"},
                    {Industry: "Information", code: "51"},
                    {Industry: "Finance and insurance", code: "52"},
                    {Industry: "Real Estate, rental and leasing", code: "53"},
                    {Industry: "Professional, scientific and technical services", code: "54"},
                    {Industry: "Management of companies and enterprises", code: "55"},
                    {Industry: "Administrative support, waste management and remediation services", code: "56"},
                    {Industry: "Educational services", code: "61"},
                    {Industry: "Health care and social assistance", code: "62"},
                    {Industry: "Arts, entertainment and recreation", code: "71"},
                    {Industry: "Accommodation and food services", code: "72"},
                    {Industry: "Other services (except public administration)", code: "81"},
                    {Industry: "Public administration", code: "92"}
                ];
                return industriesModel;
            },

            createIndustriesCheckBox: function(data){
                var box = this.getView().byId("industryCheckBox");
                jQuery.each(data, function(index, industryData){
                    var checkBox = new sap.m.CheckBox("CB-" + industryData.code, {
                        text: industryData.Industry,
                        name: industryData.code
                    });
                    box.addContent(checkBox);
                });
            },

            setPartnerPersonalDetails: function(){
                var PartnerData = this.getView().getModel().getData().PartnerData;
                console.log("***************getService*UserInfo*****************");
                console.log(sap.ushell.Container.getService("UserInfo"));
                console.log(sap.ushell.Container.getService("UserInfo").getId());
                console.log(sap.ushell.Container.getService("UserInfo").getUser());
                console.log(sap.ushell.Container.getService("UserInfo").getUser().getFullName());
                console.log(sap.ushell.Container.getService("UserInfo").getUser().getEmail());

                // var fullName = ['test01', 'test02']; //sap.ushell.services.Container.getService("UserInfo").getUser().getFullName().split(" ");
                var fullName = sap.ushell.Container.getService("UserInfo").getUser().getFullName().split(" ");
                PartnerData.PartnerContactFirstName = fullName[0];
                PartnerData.PartnerContactLastName = fullName[1];
                //PartnerData.PartnerContactEmail = 'test000@sap.com'; //sap.ushell.services.Container.getService("UserInfo").getUser().getEmail();
                PartnerData.PartnerContactEmail = sap.ushell.Container.getService("UserInfo").getUser().getEmail();
            },

            disableCheckBox: function(oEvent){

                var checkBoxToDisable;
                if (oEvent === null) {//first loading
                    //get combobox selection
                    var selected = this.getView().byId("mainIndustry");
                    if (selected.getSelectedKey() === "") {
                        selected.setSelectedKey(11);
                    }
                    checkBoxToDisable = this.byId("CB-" + selected.getSelectedItem().getKey());
                } else {
                    checkBoxToDisable = this.byId("CB-" + oEvent.getParameters().selectedItem.mProperties.key);
                }

                checkBoxToDisable.setProperty("enabled",false);

                if (!this.isFirstTime) {
                    if (this.lastDisabledCheckbox !== checkBoxToDisable) {
                        this.lastDisabledCheckbox.setProperty("enabled",true);
                        this.lastDisabledCheckbox = checkBoxToDisable;
                    }
                } else {
                    this.lastDisabledCheckbox = checkBoxToDisable;
                    this.isFirstTime = false;
                }
            },

            validateFields: function(validationFields, eShouldContinue) {
                var shouldContinue = eShouldContinue;
                var that = this;
                jQuery.each(validationFields,function(key, val) {
                    var dataFieldEl = that.byId( key);
                    if (val === "") {
                        dataFieldEl.setValueState("Error");
                        shouldContinue = false;
                    } else {
                        dataFieldEl.setValueState();
                    }
                });

                return shouldContinue;
            },


            validateStep1: function(){

                var shouldContinue = true;
                var PartnerData = this.getView().getModel().getData().PartnerData;
                var validationFields = {
                    "txtCompanyName": PartnerData.CompanyName,
                    "txtAddress": PartnerData.Address,
                    "txtCity": PartnerData.City,
                    "ddbCountry": PartnerData.Country,
                    "txtPostalCode": PartnerData.PostalCode,
                    "txtCompanyPhone": PartnerData.CompanyPhone,
                    "txtCompanyWebAddress": PartnerData.CompanyWebAddress,
                    "ddbCommLang": PartnerData.PrimaryCommunicationLanguage
                };

                shouldContinue = this.validateFields(validationFields, shouldContinue);

                //validate company email field
                var companyEmailEl = this.byId("txtCompanyEmail");
                var re = /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
                var isValiDEmail = re.test(PartnerData.CompanyEmail);
                if (PartnerData.CompanyEmail === "" || !isValiDEmail) {
                    companyEmailEl.setValueState("Error");
                    shouldContinue = false;
                } else {
                    companyEmailEl.setValueState();
                }
                //validate company DUNS number field
                var companyDunsNumberEl = this.byId("txtDuns");
                if (PartnerData.DUNSNumber === "" || (PartnerData.DUNSNumber.length !== 9) || !Number(PartnerData.DUNSNumber)) {
                    companyDunsNumberEl.setValueState("Error");
                    shouldContinue = false;
                } else {
                    companyDunsNumberEl.setValueState();
                }
                return shouldContinue;
            },

            validateStep2: function(){
                var shouldContinue = true;
                var PartnerData = this.getView().getModel().getData().PartnerData;
                var validationFields = {
                    "ddbSalutation": PartnerData.PartnerContactSalutation,
                    "txtJobTitle": PartnerData.PartnerContactJobTitle,
                    "ddbPreferredLanguage": PartnerData.PartnerContactPreferredLanguage,
                    "txtPhone": PartnerData.PartnerContactPhone
                };


                var validationAddressFields = {
                    "txtPostalCodeContact": PartnerData.PartnerContactPostalCode,
                    "txtAddressContact": PartnerData.PartnerContactAddress,
                    "PartnerContactCountry": PartnerData.PartnerContactCountry,
                    "txtCityContact": PartnerData.PartnerContactCity
                };
                //validate company email field
                var addressIndicator = PartnerData.AddressIndicator;
                var that = this;
                jQuery.each(validationAddressFields, function(key, val) {
                    var dataFieldEl = that.byId(key);
                    if (addressIndicator && val === "") {
                        dataFieldEl.setValueState("Error");
                        shouldContinue = false;
                    } else {
                        dataFieldEl.setValueState();
                    }
                });

                shouldContinue = this.validateFields(validationFields, shouldContinue);
                return shouldContinue;
            },



            validateStep3: function(){
                var shouldContinue = true;
                var PartnerData = this.getView().getModel().getData().PartnerData;
                var validationFields = {
                    "txtTotalNumOfCust": PartnerData.NumberOfCustomers,
                    "txtNoOfEmployees": PartnerData.NumberOfEmployees
                };

                shouldContinue = this.validateFields(validationFields, shouldContinue);
                //validate company DUNS number field
                var yearFoundedEl = this.byId("txtYearFounded");
                if (PartnerData.YearFounded === "" || (Number(PartnerData.YearFounded) < 0) || (Number(PartnerData.YearFounded) > 9999)) {
                    yearFoundedEl.setValueState("Error");
                    shouldContinue = false;
                } else {
                    yearFoundedEl.setValueState();
                }
                return shouldContinue;
            },

            getLinkToAppStatus: function(){

                var location = window.location;
                var url = location.protocol + "//" + location.host + location.pathname + location.search + "#Approval-Approval";
                return url;
            },

            submitData: function(){
                var that = this;
                var selfView = that.getView();
                selfView.setBusy(true);
                var resourceBundle = that.resourceBundle;

                var PartnerData = this.getView().getModel().getData().PartnerData;
                PartnerData.PartnerProgramCode = sap.ui.getCore().byId("partnerProgram").getSelectedButton().getCustomData()[0].getValue();
                PartnerData.PartnerTypeCode = sap.ui.getCore().byId("partnerType").getSelectedButton().getCustomData()[0].getValue();

                var arrString = "[";
                var isIndustrySelected = false;
                var mainIndustry = this.getView().getModel().getData().PartnerData.mainIndustry;
                if (mainIndustry) {
                    isIndustrySelected = true;
                    arrString = arrString + "{\"IndustryClassificationSystemCode\":\"0005\", \"DefaultIndicator\":\"true\", \"listID\":\"0005\", \"IndustrialSectorCode\":\"" + mainIndustry + "\"},";
                }
                var industries = this.getView().byId("industryCheckBox").mAggregations.content,
                        totalIndustries = industries.length,
                        i;

                for (i = 0; i < totalIndustries; i++) {
                    if (industries[i].mProperties.selected) {
                        if (industries[i].mProperties.name !== mainIndustry) {
                            isIndustrySelected = true;
                            arrString = arrString + "{\"IndustryClassificationSystemCode\":\"0005\", \"listID\":\"0005\", \"IndustrialSectorCode\":\"" + industries[i].mProperties.name + "\"},";
                        }
                    }
                }
                if (arrString.length > 1) {
                    arrString = arrString.substring(0, arrString.length - 1);
                }
                arrString = arrString + "]";
                PartnerData.PartnerOnboardingIndustry = JSON.parse(arrString);
                PartnerData.PartnerOnboardingText = [{"Text": this.byId("partnerOnboardingTextData").getValue()}];
                PartnerData.NumberOfCustomers = Number(PartnerData.NumberOfCustomers);
                PartnerData.NumberOfEmployees = Number(PartnerData.NumberOfEmployees);
                if (!isIndustrySelected) {
                    delete PartnerData.PartnerOnboardingIndustry;
                }
                delete PartnerData.mainIndustry;
                PartnerData.AddressIndicator = !PartnerData.AddressIndicator;

                // var batchChanges = [];
                this.oDataModel.setHeaders({"Content-ID": "Part1"});
                // batchChanges.push( this.oDataModel.createBatchOperation("PartnerOnboardingRequestCollection", "POST", PartnerData) );
                // this.oDataModel.addBatchChangeOperations(batchChanges);
                this.oDataModel.setUseBatch(true);
                this.oDataModel.createEntry("PartnerOnboardingRequestCollection", {
                    properties: PartnerData
                });

                //the call below is done to the C4C backend to store the data in the staging bo
                this.oDataModel.submitChanges({
                    success: function(res) {
                        try {
                            //if the data gets saved successfully in the backend this code will execute else check the "else" part
                            if (res.__batchResponses[0].__changeResponses[0].statusCode === "201") {
                                //now we need to send the call to CP to notify them that the new user needs to be registered in the SAP ID service.
                                var applicationID = res.__batchResponses[0].__changeResponses[0].data.ApplicationID;
                                var siteID = sap.hana.uis.flp.model.UISFioriModel.json.site.ID; /*(document.location.search.split('='))[1]*/
                                var cpCallURL = "/fiori/v1/services/invitations/register/" + siteID + "?platform=C4C";
                                var cpData = {
                                    "mail": PartnerData.PartnerContactEmail,
                                    "candidateFirstName": PartnerData.PartnerContactFirstName,
                                    "candidateLastName": PartnerData.PartnerContactLastName
                                };
                                var cpDataJson = JSON.stringify(cpData);
                            }
                        } catch(err) {
                            selfView.setBusy(false);
                            PartnerData.mainIndustry = mainIndustry;
                            PartnerData.AddressIndicator = !PartnerData.AddressIndicator;
                            if (res.__batchResponses[0].response.statusCode !== "201") {
                                try {
                                    // var errorDoc = jQuery(res.__batchResponses[0].response.body);
                                    // var error = errorDoc.find("message");
                                    var error = JSON.parse(res.__batchResponses[0].response.body).error.message.value;
                                    try {
                                        MessageBox.alert(error);
                                    } catch(e) {
                                        MessageBox.alert(resourceBundle.getText("Error.Backend"));
                                    }
                                } catch(e) {
                                    MessageBox.alert(resourceBundle.getText("Error.Backend"));
                                }
                            }
                        }
                    }, 
                    error: function(xhr) {
                        try {
                            selfView.setBusy(false);
                            PartnerData.mainIndustry = mainIndustry;
                            PartnerData.AddressIndicator = !PartnerData.AddressIndicator;
                            // var errorDoc = jQuery( xhr.response.body );
                            // var error = errorDoc.find("message");
                            var error = JSON.parse(xhr.response.body).error.message
                            try {
                                MessageBox.alert(error[0].innerHTML);
                            } catch(err) {
                                MessageBox.alert(resourceBundle.getText("Error.Backend"));
                            }
                        } catch(err) {
                            MessageBox.alert(resourceBundle.getText("Error.Backend"));
                        }
                    }
                });
            },


            /** getServiceUrl - returns query value
             * @memberOf view.c4ctable
             * @returns portalQuery/defaultQuery
             */
            getServiceUrl: function (query) {
                // return ["/", window.generalNameSpace.pathToDestination, query].join('');
                return ["", query].join('');
            }
		});
	});

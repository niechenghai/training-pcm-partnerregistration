/*global QUnit*/

sap.ui.define([
	"comdemo.pcm./partnerregistration2/controller/PartnerRegistration.controller"
], function (Controller) {
	"use strict";

	QUnit.module("PartnerRegistration Controller");

	QUnit.test("I should test the PartnerRegistration controller", function (assert) {
		var oAppController = new Controller();
		oAppController.onInit();
		assert.ok(oAppController);
	});

});

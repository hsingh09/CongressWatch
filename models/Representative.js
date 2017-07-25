"use strict";
exports.__esModule = true;
var Representative = (function () {
    function Representative(firstName, lastName) {
        this.firstName = firstName;
        this.lastName = lastName;
    }
    Representative.prototype.SetRepresentativeId = function (repId) {
        this.representativeId = repId;
    };
    Representative.prototype.SetChamber = function (chamber) {
        this.chamber = chamber;
    };
    return Representative;
}());
exports.Representative = Representative;

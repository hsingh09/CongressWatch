"use strict";
exports.__esModule = true;
var Representative = (function () {
    function Representative(firstName, lastName, st) {
        this.firstName = firstName;
        this.lastName = lastName;
        this.state = st;
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

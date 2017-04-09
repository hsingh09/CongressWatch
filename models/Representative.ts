export const enum Chamber
{
    House,
    Senate
}

export class Representative 
{
    firstName: string;
    lastName: string;
    chamber: Chamber;
    representativeId : string
    constructor(firstName : string, lastName : string)
    {
        this.firstName = firstName;
        this.lastName = lastName;
    }

    SetRepresentativeId(repId : string)
    {
        this.representativeId = repId;
    }

    SetChamber(chamber : Chamber)
    {
        this.chamber = chamber;
    }
}
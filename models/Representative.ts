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
    representativeId : string;
    state : string;
    constructor(firstName : string, lastName : string, st : string)
    {
        this.firstName = firstName;
        this.lastName = lastName;
        this.state = st;
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
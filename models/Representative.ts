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
    state : string
    constructor(firstName : string, lastName : string, state : string)
    {
        this.firstName = firstName;
        this.lastName = lastName;
        this.state = state;
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
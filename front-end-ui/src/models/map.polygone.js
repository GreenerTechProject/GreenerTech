class polygone {
    title = '';
    coordinates = [];
    type = '';
    creation_date = new Date();  

    constructor(title, coordinates, type, creation_date) {
        this.title = title;
        this.coordinates = coordinates;
        this.type = type;
        this.creation_date = creation_date;
    }
}

export default polygone;

class Serre extends polygone {
    color = '#FF0000';
    constructor(title, coordinates, creation_date) {
        super(title, coordinates, 'serre' ,creation_date);
    }
}

class Domaine extends polygone {
    color = '#00FF00';
    constructor(title, coordinates) {
        super(title, coordinates, 'parcelle', creation_date);
    }
}

class Billon extends polygone {
    color = '#0000FF';
    constructor(title, coordinates) {
        super(title, coordinates, 'billon',creation_date);
    }
}


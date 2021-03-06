// set the dimensions and margins of the graph
var margin = {top: 30, right: 10, bottom: 10, left: 10},
        width = 900 - margin.left - margin.right,
        height = 700 - margin.top - margin.bottom;

// Nb d'occurences pour chaque pays de naissance d'1 artiste
cptPaysNaissance = {};
// Nb d'occurences pour chaque pays où 1 artiste a "réussi"
cptPaysDebutCarriere = {};
// Pour afficher tous les pays (distinct)
nomPays = [];
// Pour afficher tous les genres (distinct)
listeGenres = [];
// Pour stocker les genres à l'intérieur de tab de genres dans le csv
genre = [];
// Pour stocker la liste des artistes récupérés selon leurs genres
listeArtistesByGenre = [];
// Titres des axes
listeTitresAxes = [{
        name: "PaysNaissance",
        type: "String"
    }, {
        name: "PaysDebutCarriere",
        type: "String"
    }, {
        name: "DernierPaysConnu",
        type: "String"
    }];

dataTab = [];

var div = d3.select("body").append("div")
        .attr("class", "tooltip")
        .style("opacity", 0);

d3.csv("data/superdatadeluxe.csv", function (error, data) {

    data.forEach(function (d) {

        // --------- Alimenter la bd avec tous les pays présents dans le csv--------- // 
        if (!nomPays.includes(d.PaysNaissance) && d.PaysNaissance !== "") {
            nomPays.push(d.PaysNaissance);
        } else if (!nomPays.includes(d.PaysDebutCarriere) && d.PaysDebutCarriere !== "") {
            nomPays.push(d.PaysDebutCarriere);
        }

        // --------- Alimenter la bd avec tous les genres présents dans le csv--------- // 
        // Si le genre n'a pas été inséré dans la liste
        if (!listeGenres.includes(d.GenreMusique) && d.GenreMusique !== "") {
            // Et que le genre dans le csv est un tab de genres
            if (d.GenreMusique.includes(",")) {
                // Alors on split le tableau
                genre = d.GenreMusique.split(",");
                // Pour chaque genre dans le tableau
                for (g in genre) {
                    // Si le genre n'est pas vide et qu'il n'est pas dans la liste
                    if (genre[g] !== "" && !listeGenres.includes(genre[g])) {
                        // On insère dans la liste des genres
                        listeGenres.push(genre[g]);
                    }
                }
            } else {
                listeGenres.push(d.GenreMusique);
            }
        }
       
        // --------- Classer les pays selon la fréquence d'apparition --------- //
        alimenterDico(cptPaysDebutCarriere, d.PaysNaissance);
        alimenterDico(cptPaysNaissance, d.PaysDebutCarriere);

        addData(d);
    });

    genererCheckboxes(nomPays);
    genererSelect(listeGenres);
    draw(dataTab);
});

function draw(data) {
    // append the svg object to the body of the page
    var svg = d3.select("#my_dataviz")
            .append("svg")
            .attr("width", width + margin.left + margin.right)
            .attr("height", height + margin.top + margin.bottom)
            .append("g")
            .attr("transform",
                    "translate(" + margin.left + "," + margin.top + ")")
    
    // Extract the list of dimensions we want to keep in the plot. Here I keep all except the column called Species
    dimensions = listeTitresAxes.map(function (d) {
        return d.name;
    });
    // For each dimension, I build a linear scale. I store all in a y object
    var y = {};

    for (var i = 0; i < dimensions.length; i++) {
        name = dimensions[i];
        // Initialiser y pour pouvoir le redéfinir ensuite
        y[name] = d3.scaleBand().range([height, 0]);
        // Si on est sur la 1ère barre des ordonnées
        if (i === 0) {
            y[name] = d3.scaleBand()
                    .domain(data.map(function (d) {
                        // Récupérer les pays de naissance
                        return d.PaysNaissance;
                    }))
                    .range([height, 0])
            // Si on est sur la 2ème barre des ordonnées
        } else if (i === 1) {
            y[name] = d3.scaleBand()
                    .domain(data.map(function (d) {
                        // Récupérer les pays de "début de carrière"
                        return d.PaysDebutCarriere;
                    }))
                    .range([height, 0])
            // Si on est sur la 3ème barre des ordonnées
        } else if (i === 2) {
            y[name] = d3.scaleBand()
                    .domain(data.map(function (d) {
                        return d.DernierPaysConnu;
                    }))
                    .range([height, 0])
        }
    }

    // Build the X scale -> it find the best position for each Y axis
    x = d3.scaleBand()
            .range([0, width])
            .padding(1)
            .domain(dimensions);

    // The path function take a row of the csv as input, and return x and y coordinates of the line to draw for this raw.
    function path(d) {

        return d3.line()(dimensions.map(function (p) {
            return [x(p), y[p](d[p]) + y[p].bandwidth() / 2];
        }));
    }

    // Draw the lines
    svg
            .selectAll("myPath")
            .data(data, function (d) {
                tab = {};
                //Index des pays sur l'axe
                tab[dimensions[0]] = d.PaysNaissance;
                tab[dimensions[1]] = d.PaysDebutCarriere;
                tab[dimensions[2]] = d.PaysNaissance;
                return tab;
            })
            .enter().append("path")
            .attr("d", path)
            .style("fill", "none")
            .style("stroke", "blue")
            // Gestion du tooltip
            .on("mouseover", function (d) {
                div.transition()
                        .duration(200)
                        .style("opacity", .9);
                div.html("<b>You're watching a geographical migration, congrats! </b>"+
                        "<br/> <b>This is based on: </b>" + d.TitreAlbum + "<b> album info!</b>")
                        .style("left", (d3.event.pageX) + "px")
                        .style("top", (d3.event.pageY - 28) + "px");
            })
            .on("mouseout", function (d) {
                div.transition()
                        .duration(500)
                        .style("opacity", 0);
            });

    // Draw the axis:
    svg.selectAll("myAxis")
            // For each dimension of the dataset I add a 'g' element:
            .data(dimensions).enter()
            .append("g")
            // I translate this element to its right position on the x axis
            .attr("transform", function (d) {
                return "translate(" + x(d) + ")";
            })
            // And I build the axis with the call function
            .each(function (d) {
                d3.select(this).call(d3.axisLeft().scale(y[d]));
            })
            // Add axis title
            .append("text")
            .style("text-anchor", "middle")
            .attr("y", -9)
            .text(function (d) {
                return d;
            })
            .style("fill", "black");

}
/**
 * Permet d'insérer dans un dictionnaire, un pays donné et le nb de fois qu'il est apparu
 * NB : Dico composé de la manière suivante : Clé = Pays & Valeur = nb d'occurences
 * @param {type} dico Le nom du dico à implémenter
 * @param {type} paysBd Le nom du pays à traiter
 */
function alimenterDico(dico, paysBd) {
    // Si le dictionnaire n'existe pas (est vide)
    if ((!Object.keys(dico).length === 0)
            // Ou que dictionnaire existe et ne contient pas le pays
            || (!Object.keys(dico).includes(paysBd))) {
        // Insérer le pays dans le dictionnaire
        dico[paysBd] = 1;
        // Si pays déjà inséré
    } else if (Object.keys(dico).includes(paysBd)) {
        // Incrémenter de 1 le nb d'occurences
        dico[paysBd] += 1;
    }
}

/**
 * Permet de sélectionner toutes les cases à cocher
 * @returns {undefined}
 */
function selectAll() {
    // Référence au xpath
    nomPays.forEach(function (p) {
        var checkboxes = document.querySelectorAll("input[id='" + p + "']");
        for (let i = 0; i < checkboxes.length; i++) {
            checkboxes[i].checked = true;
        }
    });

}

/**
 * Permet de décocher toutes les cases à cocher
 * @returns {undefined}
 */
function clearAll() {
    // On réinit le tab des pays à afficher
    dataTab = [];
    // Mettre à jour l'affichage des checkbox
    nomPays.forEach(function (p) {
        var checkboxes = document.querySelectorAll("input[id='" + p + "']");
        for (let i = 0; i < checkboxes.length; i++) {
            checkboxes[i].checked = false;
        }
    });
}

/**
 * Permet de générer toutes les cases à cocher
 * @param {type} bdNoms La liste (select distinct) de tous les pays dans le csv
 * @returns {undefined}
 */
function genererCheckboxes(bdNoms) {
    bdNoms.forEach(d => {
        // --------- Génération des checkbox--------- //
        var myDiv = document.getElementById("div-checkboxes");
        var checkbox = document.createElement('input');
        checkbox.type = "checkbox";
        // Id sélectionné lors des actions selectAll/clearAll
        checkbox.id = d;
        checkbox.checked = true;

        var label = document.createElement("label");
        label.htmlFor = "id";
        label.appendChild(document.createTextNode(d));
        
        // Pour toute action sur la checkbox
        checkbox.addEventListener('change', (event) => {
            if (checkbox.checked === true){
                d3.csv("data/superdatadeluxe.csv", function (error, data) {
                    data.forEach(function (d) {
                        if (d.PaysNaissance === event.originalTarget.id) {
                            addData(d);
                        }
                    });
                });
            } else if (checkbox.checked === false){
                for (var i = 0; dataTab.length; i++){
                    do {
                        dataTab.splice(i,1);
                    } while (dataTab[i].PaysNaissance === checkbox.id)
                }
            }
        });

        myDiv.appendChild(checkbox);
        myDiv.appendChild(label);

    });
}

function genererSelect(listeGenres) {
    var myDiv = document.getElementById("div-selectboxes");
    var selectbox = document.createElement('select');
    selectbox.id = "selectbox";
    selectbox.selected = "All genres";
    myDiv.appendChild(selectbox);

    listeGenres.forEach(d => {
        // --------- Génération des options pour la selectbox--------- //
        var option = document.createElement("option");
        option.value = d;
        option.text = d;

        selectbox.appendChild(option);
    });
    // Création d'une option par défaut (tous les genres)
    var optionAllGenres = document.createElement("option");
    optionAllGenres.value = "All genres";
    optionAllGenres.text = "All genres";
    optionAllGenres.selected = "selected";
    
    // Pour toute action sur la checkbox
    selectbox.addEventListener('change', (event) => {
        d3.csv("data/superdatadeluxe.csv", function (error, data) {

            if (event.explicitOriginalTarget.selectedOptions[0].value === "All genres") {
                data.forEach(function (d) {
                    addData(d);
                });
            } else {
                dataTab = [];
                data.forEach(function (d) {
                    if (d.GenreMusique.includes(event.explicitOriginalTarget.selectedOptions[0].value)) {
                        addData(d);
                    }
                });
            }
        });
    });
    selectbox.appendChild(optionAllGenres);
}

/**
 * Service d'accesseur à notre constante dataTab
 * @returns {Array|dataTab}
 */
function getData() {
    return dataTab;
}


/**
 * Permet de récupérer les tuples du csv concernés et de redessiner le graph
 * @returns {undefined}
 */
function updateChanges() {
    d3.select("svg").remove();
    draw(getData());
}

/**
 * 
 * @param {type} d
 * @returns {undefined}
 */
function addData(d) {
    dataTab.push(d);
}

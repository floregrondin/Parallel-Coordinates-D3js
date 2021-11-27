// set the dimensions and margins of the graph
var margin = {top: 30, right: 10, bottom: 10, left: 10},
        width = 960 - margin.left - margin.right,
        height = 3000 - margin.top - margin.bottom;

// append the svg object to the body of the page
var svg = d3.select("#my_dataviz")
        .append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .append("g")
        .attr("transform",
                "translate(" + margin.left + "," + margin.top + ")");

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
        name: "Birth",
        type: "String"
    }, {
        name: "Famous",
        type: "String"
    }, {
        name: "Last known",
        type: "String"
    }];


d3.csv("data/data.csv", function (error, data) {

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

        recupererArtisteSelonGenre("Electronic", d);

    });

    //console.log(cptPaysDebutCarriere);
    //console.log(cptPaysNaissance);
    //console.log(listeArtistesByGenre);

    // Extract the list of dimensions we want to keep in the plot. Here I keep all except the column called Species
    dimensions = listeTitresAxes.map(function(d) { return d.name; });

    // For each dimension, I build a linear scale. I store all in a y object
    var y = {};
    
    for (var i = 0; i < dimensions.length; i++){
        name = dimensions[i];
        // Initialiser y pour pouvoir le redéfinir ensuite
        y[name] = d3.scaleBand().range([height, 0]);
        // Si on est sur la 1ère barre des ordonnées
        if (i === 0){
            y[name] = d3.scaleBand()
                .domain(data.map(function (d) {
                    // Récupérer les pays de naissance
                    return d.PaysNaissance;
                }))
                .range([height, 0])
        // Si on est sur la 2ème barre des ordonnées
        } else if (i === 1){
            y[name] = d3.scaleBand()
                    .domain(data.map(function (d) {
                        // Récupérer les pays de "début de carrière"
                        return d.PaysDebutCarriere;
                    }))
                    .range([height, 0])
        // Si on est sur la 3ème barre des ordonnées
        } else if (i === 2){
            y[name] = d3.scaleBand()
                    .domain(data.map(function (d) {
                        return d.PaysNaissance;
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
            return [x(p), y[p](d[p])];
        }));
    }

    // Draw the lines
    svg
            .selectAll("myPath")
            .data(data, function (d) {
                tab = {};
                //Index des pays sur l'axe
                //tab[dimensions[0]]=y[dimensions[0]](d.PaysNaissance);
                //tab[dimensions[1]]=y[dimensions[1]](d.PaysDebutCarriere);
                //tab[dimensions[2]]=y[dimensions[0]](d.PaysNaissance);

                tab[dimensions[0]]=d.PaysNaissance;
                tab[dimensions[1]]=d.PaysDebutCarriere;
                tab[dimensions[2]]=d.PaysNaissance;
                console.log(tab);
                return tab;
            })
            .enter().append("path")
            .attr("d", path)
            .style("fill", "red")
            .style("stroke", "#69b3a2")
            .style("opacity", 0.5)

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
            .style("fill", "black")

});

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
 * Permet de récupérer une liste d'artistes dont le genre musical correspond à celui donné en entrée
 * @param {type} genre Le genre musical
 * @param {type} data La donnée issue du csv (doit comporter les champs GenreMusique et Artiste)
 */
function recupererArtisteSelonGenre(genre, data) {
    // Pour stocker les genres compris dans des tableaux de genres dans le csv
    genreIndiv = [];
    // Si le genre est dans un tab dans le csv
    if (data.GenreMusique.includes(",")) {
        // Alors on éclate le tab
        genreIndiv = data.GenreMusique.split(",");
        // Pour chaque genre du tab
        for (g in genreIndiv) {
            // Si le genre n'est pas une chaine de caractères vide et qu'il correspond au genre recherché
            if (genreIndiv[g] !== "" && genreIndiv[g] === genre) {
                listeArtistesByGenre.push(data.Artiste);
            }
        }
    } else if (data.GenreMusique === genre) {
        listeArtistesByGenre.push(data.Artiste);
    }
}
var margin = {top: 30, right: 10, bottom: 10, left: 10},
        width = 960 - margin.left - margin.right,
        height = 500 - margin.top - margin.bottom;

var x = d3.scale.ordinal().rangePoints([0, width], 1),
        y = {},
        dragging = {};

var line = d3.svg.line(),
        axis = d3.svg.axis().orient("left"),
        background,
        foreground;

var svg = d3.select("body").append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .append("g")
        .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

// Titres des axes
listeTitresAxes = {
    "Lieu de naissance":1,
    "Localisation lors de l'apogée de l'artiste":1,
    "Dernière localisation connue":1
};

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
                    if(genre[g] !== "" && !listeGenres.includes(genre[g])){
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
    
    // Extract the list of dimensions and create a scale for each.
    x.domain(dimensions = d3.keys(listeTitresAxes).filter(function (d) {
        return (y[d] = d3.scale.linear()
                .domain(d3.extent(data, function (p) {
                    return +p[d];
                }))
                .range([height, 0]));
    }));

    // Add grey background lines for context.
    background = svg.append("g")
            .attr("class", "background")
            .selectAll("path")
            .data(data)
            .enter().append("path")
            .attr("d", path);

    // Add blue foreground lines for focus.
    foreground = svg.append("g")
            .attr("class", "foreground")
            .selectAll("path")
            .data(data)
            .enter().append("path")
            .attr("d", path);

    // Add a group element for each dimension.
    var g = svg.selectAll(".dimension")
            .data(dimensions)
            .enter().append("g")
            .attr("class", "dimension")
            .attr("transform", function (d) {
                return "translate(" + x(d) + ")";
            })
            .call(d3.behavior.drag()
                    .origin(function (d) {
                        return {x: x(d)};
                    })
                    .on("dragstart", function (d) {
                        dragging[d] = x(d);
                        background.attr("visibility", "hidden");
                    })
                    .on("drag", function (d) {
                        dragging[d] = Math.min(width, Math.max(0, d3.event.x));
                        foreground.attr("d", path);
                        dimensions.sort(function (a, b) {
                            return position(a) - position(b);
                        });
                        x.domain(dimensions);
                        g.attr("transform", function (d) {
                            return "translate(" + position(d) + ")";
                        })
                    })
                    .on("dragend", function (d) {
                        delete dragging[d];
                        transition(d3.select(this)).attr("transform", "translate(" + x(d) + ")");
                        transition(foreground).attr("d", path);
                        background
                                .attr("d", path)
                                .transition()
                                .delay(500)
                                .duration(0)
                                .attr("visibility", null);
                    }));

    // Add an axis and title.
    g.append("g")
            .attr("class", "axis")
            .each(function (d) {
                d3.select(this).call(axis.scale(y[d]));
            })
            .append("text")
            .style("text-anchor", "middle")
            .attr("y", -9)
            .text(function (d) {
                return d;
            });

    // Add and store a brush for each axis.
    g.append("g")
            .attr("class", "brush")
            .each(function (d) {
                d3.select(this).call(y[d].brush = d3.svg.brush().y(y[d]).on("brushstart", brushstart).on("brush", brush));
            })
            .selectAll("rect")
            .attr("x", -8)
            .attr("width", 16);
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
function recupererArtisteSelonGenre(genre, data){
    // Pour stocker les genres compris dans des tableaux de genres dans le csv
    genreIndiv = [];
    // Si le genre est dans un tab dans le csv
    if (data.GenreMusique.includes(",")) {
        // Alors on éclate le tab
        genreIndiv = data.GenreMusique.split(",");
        // Pour chaque genre du tab
        for (g in genreIndiv) {
            // Si le genre n'est pas une chaine de caractères vide et qu'il correspond au genre recherché
            if (genreIndiv[g] !== "" && genreIndiv[g] === genre){
                listeArtistesByGenre.push(data.Artiste);
            }
        }
    } else if (data.GenreMusique === genre) {
        listeArtistesByGenre.push(data.Artiste);
    }
}

function position(d) {
    var v = dragging[d];
    return v == null ? x(d) : v;
}

function transition(g) {
    return g.transition().duration(500);
}

// Returns the path for a given data point.
function path(d) {
    return line(dimensions.map(function (p) {
        return [position(p), y[p](d[p])];
    }));
}

function brushstart() {
    d3.event.sourceEvent.stopPropagation();
}

// Handles a brush event, toggling the display of foreground lines.
function brush() {
    var actives = dimensions.filter(function (p) {
        return !y[p].brush.empty();
    }),
            extents = actives.map(function (p) {
                return y[p].brush.extent();
            });
    foreground.style("display", function (d) {
        return actives.every(function (p, i) {
            return extents[i][0] <= d[p] && d[p] <= extents[i][1];
        }) ? null : "none";
    });
}
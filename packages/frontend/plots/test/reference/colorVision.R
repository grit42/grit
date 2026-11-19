#!/usr/bin/env Rscript
# Reference values for colorVision.ts: CIELAB and CIEDE2000 from farver,
# colour-vision deficiency from colorspace (Machado, Oliveira & Fernandes 2009,
# severity 1, in linear RGB).
# Writes colorVision.json beside this script; format it with prettier.

suppressMessages({
  library(colorspace)
  library(farver)
  library(jsonlite)
})

args <- commandArgs(FALSE)
script <- sub("^--file=", "", grep("^--file=", args, value = TRUE))
out <- file.path(dirname(normalizePath(script)), "colorVision.json")

# Primaries, greys, and colours the plot palettes use or used.
COLOURS <- c(
  "#000000", "#FFFFFF", "#808080", "#1D2532", "#FF0000", "#00FF00", "#0000FF",
  "#FFFF00", "#00FFFF", "#FF00FF", "#E60000", "#1A9A00", "#E15759", "#59A14F",
  "#4477AA", "#EE6677", "#228833", "#CCBB44", "#66CCEE", "#AA3377", "#E69F00",
  "#56B4E9", "#332288", "#011959", "#FACCFA"
)

rgb <- t(col2rgb(COLOURS))
lab <- convert_colour(rgb, "rgb", "lab")

colours <- lapply(seq_along(COLOURS), function(i) list(
  hex = COLOURS[i],
  lab = unname(lab[i, ]),
  deuteranopia = deutan(COLOURS[i], severity = 1, linear = TRUE),
  protanopia = protan(COLOURS[i], severity = 1, linear = TRUE),
  tritanopia = tritan(COLOURS[i], severity = 1, linear = TRUE)
))

PAIRS <- list(
  c("#E60000", "#1A9A00"), c("#E15759", "#59A14F"), c("#4477AA", "#EE6677"),
  c("#000000", "#FFFFFF"), c("#808080", "#1D2532"), c("#E69F00", "#56B4E9"),
  c("#CCBB44", "#66CCEE"), c("#011959", "#332288"), c("#FFFF00", "#FACCFA"),
  c("#228833", "#AA3377")
)
pairs <- lapply(PAIRS, function(p) list(
  a = p[1], b = p[2],
  deltaE2000 = compare_colour(
    t(col2rgb(p[1])), t(col2rgb(p[2])), "rgb", method = "cie2000"
  )[1, 1]
))

# Sharma, Wu & Dalal (2005), table 1: the hue wrap and rotation term.
SHARMA <- list(
  list(c(50, 2.6772, -79.7751), c(50, 0, -82.7485)),
  list(c(50, -1.3802, -84.2814), c(50, 0, -82.7485)),
  list(c(50, 0, 0), c(50, -1, 2)),
  list(c(50, 2.49, -0.001), c(50, -2.49, 0.0011)),
  list(c(50, 2.5, 0), c(73, 25, -18)),
  list(c(60.2574, -34.0099, 36.2677), c(60.4626, -34.1751, 39.4387)),
  list(c(22.7233, 20.0904, -46.694), c(23.0331, 14.973, -42.5619)),
  list(c(90.9257, -0.5406, -0.9208), c(88.6381, -0.8985, -0.7239))
)
sharma <- lapply(SHARMA, function(p) list(
  a = p[[1]], b = p[[2]],
  deltaE2000 = compare_colour(
    matrix(p[[1]], 1), matrix(p[[2]], 1), "lab", method = "cie2000"
  )[1, 1]
))

writeLines(
  toJSON(list(colours = colours, pairs = pairs, sharma = sharma),
    auto_unbox = TRUE, digits = 10),
  out
)
cat("wrote", out, "\n")

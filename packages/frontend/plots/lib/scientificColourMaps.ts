/**
 * Colours from Scientific colour maps 8.0.1: Crameri, F. (2018), Scientific
 * colour maps, Zenodo, doi:10.5281/zenodo.1243862; Crameri, F., Shephard, G. E.
 * & Heron, P. J. (2020), The misuse of colour in science communication, Nature
 * Communications 11, 5444.
 *
 * The Scientific colour maps are licensed under a MIT License
 * Copyright (c) 2023, Fabio Crameri
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 */

/** Space-separated colours, any number to a line. */
const hexes = (list: string): readonly string[] => list.trim().split(/\s+/);

/** The 25-colour palettes of batlow, davos and hawaii, light to dark. */
export const SEQUENTIAL_SCHEMES = {
  default: hexes(`
    #FACCFA #FCC3E1 #FDBCCB #FDB4B4 #FDAC9E #FAA485 #F19D6B #E49756
    #D29343 #BE9035 #AB8C2D #95872C #828231 #6F7D3A #5D7844 #4D734D
    #3C6D56 #2D675D #226061 #195762 #144E62 #114360 #0E375E #0A2A5C
    #011959
  `),
  muted: hexes(`
    #FEFEFE #FCFBEE #F7F7DE #EFF0CB #E3E7B8 #D0D8A4 #BBC794 #A9B98B
    #99AD88 #8BA388 #809B8B #75948F #6C8E93 #628797 #57809B #4E799D
    #43709D #39659B #2F5A96 #254D8E #1D4084 #143277 #0C2368 #05165A
    #00054A
  `),
  bright: hexes(`
    #B3F2FD #95F1F4 #7AEEE7 #66E8D3 #5FE2BD #63DBA5 #6CD48C #75CD76
    #80C55F #8ABC48 #92B135 #99A424 #9C961C #9D881D #9C7A22 #9B6F28
    #996330 #985737 #974E3E #954345 #94394D #922E55 #91235F #8F1668
    #8C0273
  `),
} as const;

/** batlowS, the categorical batlow. */
export const MANY_SERIES = hexes(`
  #011959 #FACCFA #828231 #226061 #F29D6D #4D734D #114360 #C09036
  #FDB4B4 #DD954D #356A59 #FCBFD6 #175262 #677B3E #A18A2B #0D315D
  #FCA890 #FBC6E8 #2B655E #B18D2F #5A7745 #FDAEA2 #CF9340 #0F3B5F
  #E9995C #FDBAC4 #416F53 #91862D #1B5962 #08255B #747E38 #134B61
  #F9A380 #8A842F #0E365E #124761 #154F62 #E39754 #7B8034 #1E5D62
  #99882C #195662 #0B2B5C #FDB7BC #C8913B #FCC3DF #EE9B64 #A98C2C
  #FDB1AB #FDBCCD #FBC9F1 #051F5A #F6A077 #607942 #FDAB9A #477150
  #3B6D56 #B98F32 #26635F #537549 #D69446 #6D7C3B #30685C #103F60
  #FBA689 #BD8F34 #CB923E #EB9A60 #FDB8C0 #FBC7EC #F09C69 #8E852E
  #FDBBC9 #7F8133 #031C5A #114160 #FDAC9E #5D7844 #FCA995 #185462
  #787F36 #A58B2C #0A285C #9D892B #33695A #0D335E #637A40 #165062
  #124561 #205E61 #144D62 #1D5B62 #0C2E5D #D9954A #3E6E55 #AD8C2D
  #F49F72 #868330 #B58E30 #577647
`);

/**
 * Yellow, orange and red for ±1, 2 and 3σ, 3σ standing out most: roma and
 * vik on light, batlow and lipari on dark.
 */
export const SIGMA_LINES = {
  light: ["#B68C32", "#9B5517", "#6F1107"],
  dark: ["#8E852E", "#EA8D6B", "#FDB4B6"],
} as const;

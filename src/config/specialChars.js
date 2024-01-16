export const replaceSpecialChars = (str) => {
    const specialChars = { "ñ": "n" };
    const accents = {
      á: "a",
      é: "e",
      í: "i",
      ó: "o",
      ú: "u",
      Á: "A",
      É: "E",
      Í: "I",
      Ó: "O",
      Ú: "U"
    };
    return str.replace(/[ñáéíóúÁÉÍÓÚ]/g, (match) => specialChars[match] || accents[match] || match);
  };
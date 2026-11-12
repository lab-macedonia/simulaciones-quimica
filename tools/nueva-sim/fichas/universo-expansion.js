module.exports = {
  id: 'fisica/universo-expansion', color: '#5f3dc4', iconPath: 'M32 32m-4 0a4 4 0 1 0 8 0a4 4 0 1 0-8 0M14 14l8 8M50 14l-8 8M14 50l8-8M50 50l-8-8', oa: ['FISI OA 02', 'CN1M OA 16'], route: 'ele',
  es: {
    title: 'El universo en expansión', short: 'Universo en expansión', desc: 'Simulador 3D del universo en expansión: corrimiento al rojo de galaxias, ley de Hubble, expansión sin centro, edad del universo, historia desde el Big Bang y astronomía en los observatorios de Chile.',
    tags: ['3D', 'Hubble', 'Big Bang', 'Astronomía'],
    guide: { min: 45, nivel: '1° medio y 3°–4° medio', obj: ['Interpretar el corrimiento al rojo como evidencia de que las galaxias se alejan.', 'Aplicar la ley de Hubble y estimar la edad del universo.', 'Describir la historia del universo y el aporte de los observatorios en Chile.'], prev: ['Espectro electromagnético y longitud de onda.', 'Proporcionalidad directa.'],
      act: { t: 'Mide tú la constante de Hubble', steps: ['Selecciona cinco galaxias a distintas distancias y anota d y v.', 'Grafica v frente a d y traza la recta que mejor se ajusta.', 'Calcula H₀ como la pendiente y estima la edad 1/H₀.', 'Cambia de observador y repite: ¿obtienes otro valor? Explica.'] },
      err: [['«El Big Bang fue una explosión en un punto del espacio».', 'Fue la expansión del espacio mismo, en todas partes a la vez.'], ['«La Vía Láctea es el centro del universo».', 'Cualquier observador ve las demás galaxias alejarse.'], ['«Las galaxias se alejan atravesando el espacio a gran velocidad».', 'Es el espacio entre ellas el que se estira.']],
      open: [['Una galaxia se aleja a 14 000 km/s. Con H₀ = 70 km/s/Mpc, ¿a qué distancia está y hace cuánto salió su luz?', 'd = 200 Mpc ≈ 652 millones de años luz: su luz salió hace ≈ 652 millones de años.'], ['Explica por qué el norte de Chile es un lugar privilegiado para la astronomía.', 'Aire muy seco y estable, gran altura y cielos oscuros, con muchas noches despejadas al año.']] }
  },
  en: {
    title: 'The expanding universe', short: 'Expanding universe', desc: '3D simulator of the expanding universe: galaxy redshift, Hubble’s law, expansion without a centre, the age of the universe, its history since the Big Bang and astronomy at Chile’s observatories.',
    tags: ['3D', 'Hubble', 'Big Bang', 'Astronomy'],
    guide: { min: 45, nivel: 'Grades 9 and 11–12', obj: ['Interpret redshift as evidence that galaxies are moving away.', 'Apply Hubble’s law and estimate the age of the universe.', 'Describe the history of the universe and the role of Chile’s observatories.'], prev: ['The electromagnetic spectrum and wavelength.', 'Direct proportionality.'],
      act: { t: 'Measure the Hubble constant yourself', steps: ['Select five galaxies at different distances and record d and v.', 'Plot v against d and draw the line of best fit.', 'Find H₀ as the slope and estimate the age 1/H₀.', 'Change the observer and repeat: do you get a different value? Explain.'] },
      err: [['“The Big Bang was an explosion at a point in space.”', 'It was the expansion of space itself, everywhere at once.'], ['“The Milky Way is the centre of the universe.”', 'Any observer sees the other galaxies moving away.'], ['“Galaxies move away by racing through space.”', 'It is the space between them that stretches.']],
      open: [['A galaxy recedes at 14,000 km/s. With H₀ = 70 km/s/Mpc, how far away is it and how long ago did its light leave?', 'd = 200 Mpc ≈ 652 million light-years: its light left ≈ 652 million years ago.'], ['Explain why northern Chile is a privileged place for astronomy.', 'Very dry, stable air, high altitude and dark skies, with many clear nights a year.']] }
  }
};

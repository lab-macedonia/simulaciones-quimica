module.exports = {
  id: 'fisica/optica-ojo', color: '#1864ab', iconPath: 'M8 32c8-12 40-12 48 0c-8 12-40 12-48 0zM32 25a7 7 0 1 0 0 14a7 7 0 1 0 0-14', oa: ['CN1M OA 12'], route: 'ele',
  es: {
    title: 'Lentes y el ojo humano', short: 'Lentes y el ojo', desc: 'Simulador 3D de óptica: rayos en una lente convergente, imagen real e invertida, lupa, ecuación de la lente delgada, el ojo y la acomodación, miopía e hipermetropía con su lente correctora.',
    tags: ['3D', 'Lentes', 'Ojo', 'Visión'],
    guide: { min: 45, nivel: '1° medio', obj: ['Construir con rayos la imagen que forma una lente convergente.', 'Aplicar la ecuación de la lente delgada y el aumento.', 'Explicar el funcionamiento del ojo, la acomodación y la corrección de la miopía y la hipermetropía.'], prev: ['Propagación rectilínea de la luz.', 'Operaciones con fracciones.'],
      act: { t: 'Diseña los lentes de un compañero', steps: ['Con el ojo miope, prueba lentes de −1 a −5 D hasta ver nítido de lejos.', 'Con el ojo hipermétrope, haz lo mismo para un objeto a 25 cm.', 'Compara tu resultado con la «Lente correctora sugerida» de la pestaña Cálculo.', 'Explica por qué una receta dice «−3,25 D» y qué significa el signo.'] },
      err: [['«La imagen en la retina está derecha».', 'Es invertida; el cerebro la interpreta derecha.'], ['«Una lupa agranda cualquier objeto, a cualquier distancia».', 'Solo produce imagen virtual aumentada si el objeto está dentro de la distancia focal.'], ['«Los miopes usan lentes de aumento».', 'Usan lentes divergentes (potencia negativa).']],
      open: [['Un objeto de 2 cm está a 15 cm de una lente de f = 10 cm. Calcula la posición, el tamaño y el tipo de imagen.', 'dᵢ = 30 cm, m = −2: imagen real, invertida, de 4 cm.'], ['Explica por qué las personas mayores alejan el diario para leer.', 'Con la presbicia el cristalino ya no acomoda lo suficiente; al alejar el objeto necesita menos potencia para enfocarlo.']] }
  },
  en: {
    title: 'Lenses and the human eye', short: 'Lenses and the eye', desc: '3D optics simulator: rays through a converging lens, real inverted images, the magnifying glass, the thin-lens equation, the eye and accommodation, myopia and hyperopia with their corrective lenses.',
    tags: ['3D', 'Lenses', 'Eye', 'Vision'],
    guide: { min: 45, nivel: 'Grade 9', obj: ['Use rays to construct the image formed by a converging lens.', 'Apply the thin-lens equation and magnification.', 'Explain how the eye works, accommodation and the correction of myopia and hyperopia.'], prev: ['Light travels in straight lines.', 'Working with fractions.'],
      act: { t: 'Design glasses for a classmate', steps: ['With the short-sighted eye, try lenses from −1 to −5 D until distant vision is sharp.', 'With the long-sighted eye, do the same for an object at 25 cm.', 'Compare your result with the «Suggested corrective lens» in the Calculation tab.', 'Explain why a prescription says “−3.25 D” and what the sign means.'] },
      err: [['“The image on the retina is upright.”', 'It is inverted; the brain interprets it as upright.'], ['“A magnifier enlarges any object at any distance.”', 'It only gives a virtual magnified image if the object is within the focal length.'], ['“Short-sighted people wear magnifying lenses.”', 'They wear diverging lenses (negative power).']],
      open: [['A 2 cm object is 15 cm from a lens with f = 10 cm. Calculate the position, size and type of image.', 'dᵢ = 30 cm, m = −2: real, inverted image, 4 cm tall.'], ['Explain why older people hold the newspaper further away to read.', 'With presbyopia the lens no longer accommodates enough; moving the object away means less power is needed to focus it.']] }
  }
};

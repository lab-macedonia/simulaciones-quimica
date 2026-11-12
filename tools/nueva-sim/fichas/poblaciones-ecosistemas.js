module.exports = {
  id: 'biologia/poblaciones-ecosistemas', color: '#2b8a3e', iconPath: 'M10 50c10-30 18-30 22-10s14 10 22-26', oa: ['CN1M OA 04', 'CN1M OA 05', 'CN1M OA 08'], route: 'eco',
  es: {
    title: 'Poblaciones y ecosistemas', short: 'Poblaciones y ecosistemas', desc: 'Simulador 3D de ecología: niveles de organización, crecimiento exponencial y logístico, capacidad de carga, ciclo depredador–presa (zorro culpeo y degú), competencia con una especie invasora y efectos de la pérdida de hábitat y la caza.',
    tags: ['3D', 'Ecología', 'Poblaciones', 'Chile'],
    guide: { min: 45, nivel: '1° medio', obj: ['Distinguir individuo, población, comunidad y ecosistema.', 'Explicar los factores que regulan el tamaño de una población (recursos, depredación, competencia).', 'Evaluar los efectos de la acción humana y de las especies invasoras en un ecosistema chileno.'], prev: ['Cadenas y tramas tróficas.', 'Lectura de gráficos.'],
      act: { t: '¿Qué pasa si sacamos al zorro?', steps: ['Ejecuta el ciclo depredador–presa y anota los máximos de degúes y zorros.', 'Activa la caza de zorros y registra qué ocurre con los degúes y la vegetación.', 'Repite con pérdida de hábitat del 50 %.', 'Redacta una recomendación para manejar un área protegida.'] },
      err: [['«Sin depredadores, las presas estarían mejor».', 'Crecen hasta agotar el alimento y luego colapsan; la depredación regula la población.'], ['«Las poblaciones crecen siempre».', 'Los recursos limitados las estabilizan en la capacidad de carga.'], ['«Una especie introducida aumenta la biodiversidad».', 'Las invasoras suelen desplazar a especies nativas y reducirla.']],
      open: [['Explica por qué el máximo de zorros ocurre después del máximo de degúes.', 'Los zorros necesitan tiempo para reproducirse con el alimento abundante; cuando son muchos, las presas ya disminuyen.'], ['Propón dos medidas para proteger al degú frente al conejo europeo.', 'Control de la población de conejos y conservación o restauración del hábitat nativo.']] }
  },
  en: {
    title: 'Populations and ecosystems', short: 'Populations and ecosystems', desc: '3D ecology simulator: levels of organisation, exponential and logistic growth, carrying capacity, the predator–prey cycle (culpeo fox and degu), competition with an invasive species and the effects of habitat loss and hunting.',
    tags: ['3D', 'Ecology', 'Populations', 'Chile'],
    guide: { min: 45, nivel: 'Grade 9', obj: ['Distinguish individual, population, community and ecosystem.', 'Explain the factors that regulate population size (resources, predation, competition).', 'Evaluate the effects of human activity and invasive species on a Chilean ecosystem.'], prev: ['Food chains and food webs.', 'Reading graphs.'],
      act: { t: 'What happens if we remove the fox?', steps: ['Run the predator–prey cycle and record the degu and fox peaks.', 'Turn on fox hunting and record what happens to the degus and the vegetation.', 'Repeat with 50 % habitat loss.', 'Write a recommendation for managing a protected area.'] },
      err: [['“Without predators, prey would be better off.”', 'They grow until food runs out and then crash; predation regulates the population.'], ['“Populations always grow.”', 'Limited resources level them off at the carrying capacity.'], ['“An introduced species increases biodiversity.”', 'Invasives usually displace native species and reduce it.']],
      open: [['Explain why the fox peak comes after the degu peak.', 'Foxes need time to breed while food is plentiful; when they are numerous, prey are already declining.'], ['Suggest two measures to protect the degu from the European rabbit.', 'Control of the rabbit population and conservation or restoration of native habitat.']] }
  }
};

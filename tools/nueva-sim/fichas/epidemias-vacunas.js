module.exports = {
  id: 'biologia/epidemias-vacunas', color: '#c92a2a', iconPath: 'M32 14a18 18 0 1 0 0.1 0M32 8v6M32 50v6M8 32h6M50 32h6', oa: ['CN07 OA 04', 'FG-CIBS OA 03'], route: 'eco',
  es: {
    title: 'Epidemias, sistema inmune y vacunas', short: 'Epidemias y vacunas', desc: 'Simulador 3D de epidemias: contagio entre personas con el modelo SIR, número reproductivo R₀ y R efectivo, medidas de prevención, defensas del sistema inmune, vacunas e inmunidad de rebaño.',
    tags: ['3D', 'SIR', 'Vacunas', 'Salud'],
    guide: { min: 45, nivel: '7° básico y 3°–4° medio', obj: ['Describir las barreras y las respuestas innata y adaptativa del sistema inmune.', 'Interpretar la curva de una epidemia con el modelo SIR y el número R.', 'Explicar el funcionamiento de las vacunas y la inmunidad de rebaño, y argumentar su importancia para la salud pública.'], prev: ['Microorganismos y enfermedades.', 'Porcentajes.'],
      act: { t: '¿Cuánta cobertura necesitamos?', steps: ['Con R₀ = 3, simula coberturas de 0, 30, 60 y 80 % y anota el máximo de infectados.', 'Calcula el umbral 1 − 1/R₀ y compáralo con lo observado.', 'Repite con R₀ = 15 (sarampión).', 'Escribe un mensaje breve para tu comunidad sobre la importancia de vacunarse.'] },
      err: [['«Si casi todos se vacunan, no hace falta que yo me vacune».', 'Si muchos piensan igual, la cobertura cae bajo el umbral y vuelven los brotes.'], ['«Los antibióticos curan los resfríos».', 'Los resfríos son virales; los antibióticos solo actúan sobre bacterias.'], ['«Las vacunas dan la enfermedad».', 'Generan inmunidad sin causar la enfermedad; los efectos secundarios suelen ser leves.']],
      open: [['Explica cómo una vacuna puede proteger a un recién nacido que todavía no puede recibirla.', 'Si hay suficientes inmunes a su alrededor, el patógeno no circula (inmunidad de rebaño).'], ['Con R₀ = 5 y una vacuna de 90 % de eficacia, ¿qué cobertura se necesita?', '(1 − 1/5)/0,9 = 89 %.']] }
  },
  en: {
    title: 'Epidemics, the immune system and vaccines', short: 'Epidemics and vaccines', desc: '3D epidemic simulator: person-to-person transmission with the SIR model, the reproduction number R₀ and effective R, prevention measures, immune defences, vaccines and herd immunity.',
    tags: ['3D', 'SIR', 'Vaccines', 'Health'],
    guide: { min: 45, nivel: 'Grades 7 and 11–12', obj: ['Describe the barriers and the innate and adaptive immune responses.', 'Interpret an epidemic curve with the SIR model and the number R.', 'Explain how vaccines and herd immunity work, and argue for their importance in public health.'], prev: ['Microorganisms and disease.', 'Percentages.'],
      act: { t: 'How much coverage do we need?', steps: ['With R₀ = 3, simulate coverages of 0, 30, 60 and 80 % and record the peak number of infected.', 'Calculate the threshold 1 − 1/R₀ and compare it with what you observed.', 'Repeat with R₀ = 15 (measles).', 'Write a short message for your community on why vaccination matters.'] },
      err: [['“If almost everyone is vaccinated, I don’t need to be.”', 'If many think the same, coverage drops below the threshold and outbreaks return.'], ['“Antibiotics cure colds.”', 'Colds are viral; antibiotics act only on bacteria.'], ['“Vaccines give you the disease.”', 'They create immunity without causing the disease; side effects are usually mild.']],
      open: [['Explain how a vaccine can protect a newborn who cannot yet receive it.', 'If enough people around it are immune, the pathogen does not circulate (herd immunity).'], ['With R₀ = 5 and a 90 % effective vaccine, what coverage is needed?', '(1 − 1/5)/0.9 = 89 %.']] }
  }
};

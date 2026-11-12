module.exports = {
  id: 'fisica/ondas-sonido', color: '#087f5b', iconPath: 'M14 26v12M22 20v24M30 14v36M38 20v24M46 26v12', oa: ['CN1M OA 10', 'CN1M OA 12'], route: 'ele',
  es: {
    title: 'Ondas y sonido', short: 'Ondas y sonido', desc: 'Simulador 3D de ondas sonoras: partículas del aire que forman compresiones y enrarecimientos, amplitud e intensidad, frecuencia y tono, rapidez en distintos medios, eco y funcionamiento del oído, con tono audible.',
    tags: ['3D', 'Sonido', 'Frecuencia', 'Eco'],
    guide: { min: 45, nivel: '1° medio', obj: ['Describir el sonido como una onda mecánica longitudinal.', 'Relacionar amplitud con intensidad y frecuencia con tono, y aplicar v = λ·f.', 'Explicar el eco y el funcionamiento básico del oído.'], prev: ['Noción de vibración y energía.', 'Despeje de fórmulas sencillas.'],
      act: { t: '¿Cuánto mide la onda de tu nota favorita?', steps: ['Elige tres notas (por ejemplo 262, 440 y 880 Hz) y escúchalas.', 'Calcula λ en el aire y compárala con el valor que entrega la simulación.', 'Cambia el medio a agua y acero: ¿qué cambia y qué no?', 'Usa el montaje del eco para estimar la distancia a un muro que devuelve el sonido en 0,5 s.'] },
      err: [['«En el sonido viaja el aire desde la fuente hasta el oído».', 'Las partículas solo oscilan; viaja la energía.'], ['«Un sonido más fuerte es más agudo».', 'La intensidad depende de la amplitud; el tono, de la frecuencia.'], ['«El sonido viaja más rápido en el aire que en el agua».', 'Es al revés: más rápido en líquidos y sólidos.']],
      open: [['Explica por qué en el espacio no se escucharía una explosión.', 'No hay un medio material cuyas partículas vibren para transmitir la onda.'], ['Un delfín emite un pulso de 100 kHz y recibe el eco 0,02 s después. ¿A qué distancia está el pez? (v = 1480 m/s)', 'd = 1480·0,02/2 = 14,8 m.']] }
  },
  en: {
    title: 'Waves and sound', short: 'Waves and sound', desc: '3D sound wave simulator: air particles forming compressions and rarefactions, amplitude and intensity, frequency and pitch, speed in different media, echoes and how the ear works, with an audible tone.',
    tags: ['3D', 'Sound', 'Frequency', 'Echo'],
    guide: { min: 45, nivel: 'Grade 9', obj: ['Describe sound as a longitudinal mechanical wave.', 'Relate amplitude to intensity and frequency to pitch, and apply v = λ·f.', 'Explain echoes and the basic workings of the ear.'], prev: ['The idea of vibration and energy.', 'Rearranging simple formulas.'],
      act: { t: 'How long is the wave of your favourite note?', steps: ['Choose three notes (for example 262, 440 and 880 Hz) and listen to them.', 'Calculate λ in air and compare it with the simulation’s value.', 'Switch the medium to water and steel: what changes and what does not?', 'Use the echo set-up to estimate the distance to a wall that returns the sound in 0.5 s.'] },
      err: [['“In sound, air travels from the source to the ear.”', 'The particles only oscillate; energy is what travels.'], ['“A louder sound is higher-pitched.”', 'Loudness depends on amplitude; pitch on frequency.'], ['“Sound travels faster in air than in water.”', 'It is the other way round: faster in liquids and solids.']],
      open: [['Explain why an explosion could not be heard in space.', 'There is no material medium whose particles can vibrate to carry the wave.'], ['A dolphin sends a 100 kHz pulse and receives the echo 0.02 s later. How far away is the fish? (v = 1480 m/s)', 'd = 1480·0.02/2 = 14.8 m.']] }
  }
};

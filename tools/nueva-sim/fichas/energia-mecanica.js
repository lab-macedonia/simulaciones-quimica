module.exports = {
  id: 'fisica/energia-mecanica', color: '#2b8a3e', iconPath: 'M10 18c8 30 36 30 44 0', oa: ['CN2M OA 11'], route: 'mov',
  es: {
    title: 'Energía mecánica, trabajo y potencia', short: 'Energía mecánica', desc: 'Simulador 3D de energía: trabajo de una fuerza, energía potencial gravitatoria y cinética en una pista, conservación de la energía mecánica, disipación por roce y potencia de una grúa.',
    tags: ['3D', 'Energía', 'Trabajo', 'Potencia'],
    guide: { min: 45, nivel: '2° medio', obj: ['Calcular trabajo, energía potencial y energía cinética.', 'Aplicar la conservación de la energía mecánica y reconocer la disipación por roce.', 'Relacionar trabajo, tiempo y potencia.'], prev: ['Fuerza y peso (P = m·g).', 'Potencias y raíz cuadrada.'],
      act: { t: 'La montaña rusa sin motor', steps: ['En la pista sin roce, suelta la esfera desde 2, 4 y 6 m y registra la rapidez en el fondo.', 'Compara con v = √(2gh).', 'Repite con masa 1 kg y 8 kg: ¿cambia la rapidez?', 'Agrega roce 0,1 y estima cuánta energía se disipa en la primera ida.'] },
      err: [['«Un cuerpo más pesado cae más rápido».', 'Sin roce del aire, la rapidez tras caer h no depende de la masa.'], ['«Con roce la energía se pierde».', 'Se transforma en energía térmica; la total se conserva.'], ['«Más potencia significa más trabajo».', 'La potencia es trabajo por unidad de tiempo; el mismo trabajo puede hacerse con distinta potencia.']],
      open: [['Una pelota de 0,5 kg se lanza hacia arriba a 12 m/s. ¿Qué altura máxima alcanza sin roce?', 'h = v²/(2g) = 144/19,6 = 7,3 m.'], ['Un ascensor de 800 kg sube 30 m en 20 s. Calcula el trabajo y la potencia mínima del motor.', 'W = 800·9,8·30 = 235 200 J; P = 11 760 W ≈ 11,8 kW.']] }
  },
  en: {
    title: 'Mechanical energy, work and power', short: 'Mechanical energy', desc: '3D energy simulator: work done by a force, gravitational potential and kinetic energy on a track, conservation of mechanical energy, dissipation by friction and the power of a crane.',
    tags: ['3D', 'Energy', 'Work', 'Power'],
    guide: { min: 45, nivel: 'Grade 10', obj: ['Calculate work, potential energy and kinetic energy.', 'Apply conservation of mechanical energy and recognise dissipation by friction.', 'Relate work, time and power.'], prev: ['Force and weight (W = m·g).', 'Powers and square roots.'],
      act: { t: 'The unpowered roller coaster', steps: ['On the frictionless track, release the ball from 2, 4 and 6 m and record the speed at the bottom.', 'Compare with v = √(2gh).', 'Repeat with masses of 1 kg and 8 kg: does the speed change?', 'Add friction 0.1 and estimate how much energy is dissipated on the first run.'] },
      err: [['“A heavier body falls faster.”', 'Without air resistance, the speed after falling h does not depend on mass.'], ['“With friction energy is lost.”', 'It turns into thermal energy; the total is conserved.'], ['“More power means more work.”', 'Power is work per unit time; the same work can be done with different power.']],
      open: [['A 0.5 kg ball is thrown upwards at 12 m/s. What maximum height does it reach without friction?', 'h = v²/(2g) = 144/19.6 = 7.3 m.'], ['An 800 kg lift rises 30 m in 20 s. Calculate the work and the minimum power of the motor.', 'W = 800·9.8·30 = 235,200 J; P = 11,760 W ≈ 11.8 kW.']] }
  }
};

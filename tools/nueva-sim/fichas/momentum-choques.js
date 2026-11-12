module.exports = {
  id: 'fisica/momentum-choques', color: '#6741d9', iconPath: 'M8 34h16M40 34h16M24 26v16M40 26v16', oa: ['CN2M OA 12'], route: 'mov',
  es: {
    title: 'Cantidad de movimiento y choques', short: 'Momentum y choques', desc: 'Simulador 3D de cantidad de movimiento: impulso y fuerza media (airbag), choques elásticos, inelásticos y con coeficiente de restitución, masas distintas y retroceso en un riel de aire.',
    tags: ['3D', 'Momentum', 'Impulso', 'Choques'],
    guide: { min: 45, nivel: '2° medio', obj: ['Calcular cantidad de movimiento e impulso.', 'Aplicar la conservación del momentum en choques y explosiones.', 'Distinguir choques elásticos e inelásticos por la energía cinética.'], prev: ['Velocidad como vector (signo).', 'Segunda ley de Newton.'],
      act: { t: 'Diseña un sistema de seguridad', steps: ['En el montaje «Impulso», compara la fuerza al detener el carro con Δt = 0,05 s y 0,5 s.', 'Explica por qué el producto F·Δt no cambia.', 'Relaciónalo con airbags, cascos y zonas de deformación.', 'En «Choque», mide la Ec perdida con e = 0 y e = 0,5 para masas iguales.'] },
      err: [['«En un choque se conserva la energía cinética».', 'Siempre se conserva el momentum; la Ec solo en choques elásticos.'], ['«El cuerpo más pesado ejerce más fuerza en el choque».', 'Las fuerzas son iguales (3.ª ley); cambia la aceleración.'], ['«El momentum es un número sin dirección».', 'Es un vector: velocidades opuestas tienen signos opuestos.']],
      open: [['Una pelota de 0,4 kg llega a 10 m/s a una pared y rebota a 8 m/s. Calcula el impulso recibido.', 'Δp = 0,4·(−8 − 10) = −7,2 kg·m/s (sentido opuesto al inicial).'], ['Un patinador de 60 kg en reposo lanza una mochila de 5 kg a 6 m/s. ¿Con qué velocidad retrocede?', 'V = −5·6/60 = −0,5 m/s.']] }
  },
  en: {
    title: 'Momentum and collisions', short: 'Momentum and collisions', desc: '3D momentum simulator: impulse and average force (airbag), elastic, inelastic and partially elastic collisions, different masses and recoil on an air track.',
    tags: ['3D', 'Momentum', 'Impulse', 'Collisions'],
    guide: { min: 45, nivel: 'Grade 10', obj: ['Calculate momentum and impulse.', 'Apply conservation of momentum to collisions and explosions.', 'Distinguish elastic and inelastic collisions through kinetic energy.'], prev: ['Velocity as a vector (sign).', 'Newton’s second law.'],
      act: { t: 'Design a safety system', steps: ['In the «Impulse» set-up, compare the force when the cart stops with Δt = 0.05 s and 0.5 s.', 'Explain why the product F·Δt does not change.', 'Link it to airbags, helmets and crumple zones.', 'In «Collision», measure the Ek lost with e = 0 and e = 0.5 for equal masses.'] },
      err: [['“Kinetic energy is conserved in a collision.”', 'Momentum is always conserved; Ek only in elastic collisions.'], ['“The heavier body exerts more force in a collision.”', 'The forces are equal (3rd law); what differs is the acceleration.'], ['“Momentum is a number without direction.”', 'It is a vector: opposite velocities have opposite signs.']],
      open: [['A 0.4 kg ball hits a wall at 10 m/s and bounces back at 8 m/s. Calculate the impulse it receives.', 'Δp = 0.4·(−8 − 10) = −7.2 kg·m/s (opposite to the initial direction).'], ['A 60 kg skater at rest throws a 5 kg backpack at 6 m/s. With what velocity does the skater recoil?', 'V = −5·6/60 = −0.5 m/s.']] }
  }
};

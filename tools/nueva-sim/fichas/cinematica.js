module.exports = {
  id: 'fisica/cinematica', color: '#1864ab', iconPath: 'M10 44h44M16 36l10-12 10 6 14-16', oa: ['CN2M OA 09'], route: 'mov',
  es: {
    title: 'Cinemática: MRU y MRUA', short: 'Cinemática: MRU y MRUA', desc: 'Simulador 3D de cinemática: posición, desplazamiento, movimiento rectilíneo uniforme y uniformemente acelerado, gráficos x–t y v–t, distancia de frenado y encuentro de dos móviles.',
    tags: ['3D', 'MRU', 'MRUA', 'Gráficos'],
    guide: { min: 45, nivel: '2° medio', obj: ['Distinguir posición, desplazamiento y distancia recorrida.', 'Describir el MRU y el MRUA con ecuaciones y gráficos x–t y v–t.', 'Calcular la distancia de frenado y el instante de encuentro de dos móviles.'], prev: ['Despeje de ecuaciones de primer grado.', 'Lectura de gráficos cartesianos.'],
      act: { t: '¿Cuánto necesita un auto para detenerse?', steps: ['En «Lab» fija v₀ = 10 m/s y a = −4 m/s²; anota dónde se detiene el auto.', 'Repite con v₀ = 20 m/s y v₀ = 30 m/s.', 'Construye una tabla v₀ – distancia de frenado y grafícala.', 'Explica por qué la distancia no crece en proporción a la velocidad y relaciónalo con los límites de velocidad urbanos.'] },
      err: [['«Si la velocidad es cero, la aceleración también lo es».', 'En el punto más alto de un lanzamiento o al invertir el sentido, v = 0 pero a ≠ 0.'], ['«Una velocidad negativa significa que el móvil frena».', 'El signo indica el sentido; frena cuando v y a tienen signos opuestos.'], ['«El gráfico x–t muestra la trayectoria».', 'Muestra cómo cambia la posición con el tiempo; la trayectoria aquí es una recta.']],
      open: [['Un auto a 90 km/h frena con a = −5 m/s². Calcula el tiempo y la distancia de frenado.', 'v₀ = 25 m/s; t = 25/5 = 5 s; d = 25²/(2·5) = 62,5 m.'], ['Dos ciclistas parten desde el mismo punto: A a 6 m/s y B, 4 s después, a 9 m/s en el mismo sentido. ¿Cuándo y dónde lo alcanza?', '6t = 9(t − 4) → t = 12 s desde la partida de A; x = 72 m.']] }
  },
  en: {
    title: 'Kinematics: uniform and accelerated motion', short: 'Kinematics', desc: '3D kinematics simulator: position, displacement, uniform and uniformly accelerated linear motion, x–t and v–t graphs, braking distance and two objects meeting.',
    tags: ['3D', 'Uniform', 'Accelerated', 'Graphs'],
    guide: { min: 45, nivel: 'Grade 10', obj: ['Distinguish position, displacement and distance travelled.', 'Describe uniform and accelerated motion with equations and x–t and v–t graphs.', 'Calculate braking distance and the meeting time of two objects.'], prev: ['Solving first-degree equations.', 'Reading Cartesian graphs.'],
      act: { t: 'How far does a car need to stop?', steps: ['In «Lab» set v₀ = 10 m/s and a = −4 m/s²; record where the car stops.', 'Repeat with v₀ = 20 m/s and v₀ = 30 m/s.', 'Build a table of v₀ against braking distance and plot it.', 'Explain why the distance does not grow in proportion to speed and link it to urban speed limits.'] },
      err: [['“If the velocity is zero, so is the acceleration.”', 'At the top of a throw or when reversing, v = 0 but a ≠ 0.'], ['“A negative velocity means the object is slowing down.”', 'The sign gives the direction; it slows down when v and a have opposite signs.'], ['“The x–t graph shows the path.”', 'It shows how position changes with time; the path here is a straight line.']],
      open: [['A car at 90 km/h brakes with a = −5 m/s². Calculate the braking time and distance.', 'v₀ = 25 m/s; t = 25/5 = 5 s; d = 25²/(2·5) = 62.5 m.'], ['Two cyclists start from the same point: A at 6 m/s and B, 4 s later, at 9 m/s in the same direction. When and where does B catch up?', '6t = 9(t − 4) → t = 12 s after A starts; x = 72 m.']] }
  }
};

module.exports = {
  id: 'fisica/circuitos', color: '#d9480f', iconPath: 'M12 20h40v26H12zM24 20v-6M40 20v-6M28 46l4-6 4 6', oa: ['CN08 OA 10'], route: 'ele',
  es: {
    title: 'Circuitos eléctricos en serie y en paralelo', short: 'Circuitos eléctricos', desc: 'Simulador 3D de circuitos: circuito abierto y cerrado, ley de Ohm, conexión en serie y en paralelo con ampolletas, resistencia equivalente, ampolleta fundida y potencia eléctrica.',
    tags: ['3D', 'Ohm', 'Serie', 'Paralelo'],
    guide: { min: 45, nivel: '8° básico', obj: ['Identificar los elementos de un circuito y la condición de circuito cerrado.', 'Aplicar la ley de Ohm.', 'Comparar circuitos en serie y en paralelo en corriente, voltaje, brillo y funcionamiento ante fallas.'], prev: ['Carga eléctrica y conductores.', 'Operaciones con fracciones.'],
      act: { t: '¿Cómo conectarías las luces de tu casa?', steps: ['Arma 3 ampolletas en serie y anota el brillo, la corriente y el voltaje de cada una.', 'Repite en paralelo.', 'Funde la ampolleta 1 en cada caso.', 'Escribe tres razones para usar conexión en paralelo en una vivienda.'] },
      err: [['«La corriente se gasta en la ampolleta».', 'La corriente que entra es la misma que sale; se transforma energía, no carga.'], ['«En paralelo cada ampolleta recibe menos voltaje».', 'Cada rama recibe el voltaje completo de la pila.'], ['«Más ampolletas en paralelo aumentan la resistencia total».', 'La disminuyen: hay más caminos para la corriente.']],
      open: [['Dos ampolletas de 6 Ω se conectan a 12 V, primero en serie y luego en paralelo. Calcula la corriente total y la potencia de cada ampolleta en ambos casos.', 'Serie: R = 12 Ω, I = 1 A, P = 6 W cada una. Paralelo: R = 3 Ω, I = 4 A, P = 24 W cada una.'], ['Explica por qué un cortocircuito puede provocar un incendio.', 'Sin resistencia la corriente es muy grande y los cables se calientan (P = I²R); por eso existen los fusibles y disyuntores.']] }
  },
  en: {
    title: 'Series and parallel electric circuits', short: 'Electric circuits', desc: '3D circuit simulator: open and closed circuits, Ohm’s law, series and parallel connection of bulbs, equivalent resistance, a burnt-out bulb and electric power.',
    tags: ['3D', 'Ohm', 'Series', 'Parallel'],
    guide: { min: 45, nivel: 'Grade 8', obj: ['Identify the parts of a circuit and the condition for a closed circuit.', 'Apply Ohm’s law.', 'Compare series and parallel circuits in current, voltage, brightness and behaviour when a part fails.'], prev: ['Electric charge and conductors.', 'Working with fractions.'],
      act: { t: 'How would you wire the lights in your home?', steps: ['Set up 3 bulbs in series and record the brightness, current and voltage of each one.', 'Repeat in parallel.', 'Burn out bulb 1 in each case.', 'Write three reasons for using parallel wiring in a home.'] },
      err: [['“Current is used up in the bulb.”', 'The current going in equals the current coming out; energy is transformed, not charge.'], ['“In parallel each bulb gets less voltage.”', 'Each branch gets the full cell voltage.'], ['“More bulbs in parallel increase the total resistance.”', 'They decrease it: there are more paths for the current.']],
      open: [['Two 6 Ω bulbs are connected to 12 V, first in series and then in parallel. Calculate the total current and the power of each bulb in both cases.', 'Series: R = 12 Ω, I = 1 A, P = 6 W each. Parallel: R = 3 Ω, I = 4 A, P = 24 W each.'], ['Explain why a short circuit can cause a fire.', 'With no resistance the current is very large and the wires heat up (P = I²R); that is why fuses and circuit breakers exist.']] }
  }
};

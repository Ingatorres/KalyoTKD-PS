# Especificación Técnica: Motor de Generación y Renderizado de Pirámides - KalyoTKD

Este documento proporciona una guía exhaustiva y técnica sobre la implementación del sistema de brackets (pirámides) en KalyoTKD. Está diseñado para que cualquier desarrollador pueda replicar la lógica de siembra, dispersión y renderizado vectorial de forma exacta.

---

## 1. Generación de Secuencia de Posiciones (Regla N+1)

La base del sistema es el sembrado equilibrado. Para cualquier potencia de 2 ($N$), el oponente de la posición $x$ debe ser $(N+1)-x$. Esto se implementa mediante un algoritmo recursivo que construye la secuencia de emparejamiento.

### Algoritmo de Secuencia (TypeScript)
```typescript
const generatePositionSequence = (n: number): number[] => {
    if (n === 2) return [1, 2];
    const prev = generatePositionSequence(n / 2);
    const result: number[] = [];
    for (const x of prev) {
        result.push(x);
        result.push(n + 1 - x); // Regla N+1
    }
    return result;
};
```
**Análisis:** Para $N=8$, la secuencia resultante es `[1, 8, 4, 5, 2, 7, 3, 6]`.
- Encuentro 1: Pos 1 vs Pos 8
- Encuentro 2: Pos 4 vs Pos 5
- Encuentro 3: Pos 2 vs Pos 7
- Encuentro 4: Pos 3 vs Pos 6

Esto asegura que las semillas 1 y 2 estén en mitades opuestas y solo se crucen en la final.

---

## 2. Distribución y Dispersión por Delegación (Scattering)

El objetivo es maximizar la distancia entre competidores de la misma delegación mientras se respetan las jerarquías de siembra.

### Proceso de Asignación de Slots
1.  **Protección de Siembras**: Los índices 0 y 1 de la lista de competidores se extraen y se fijan como `Seed 1` y `Seed 2`.
2.  **Agrupamiento**: El resto se agrupa en un diccionario por `delegation`.
3.  **Ordenamiento por Densidad**: Las delegaciones con más miembros se procesan primero para evitar colisiones al final.
4.  **Round-Robin de Asignación**:
    ```typescript
    const assignedRest: Competitor[] = [];
    let memberIdx = 0;
    while (hasMore) {
        for (const del of sortedDelegations) {
            if (memberIdx < groups[del].length) {
                assignedRest.push(groups[del][memberIdx]);
            }
        }
        memberIdx++;
    }
    const finalSequence = [seed1, seed2, ...assignedRest];
    ```
5.  **Mapeo Final**: Los competidores en `finalSequence[i]` se asignan al slot `bracket[i]`. Los slots sobrantes hasta completar la potencia de 2 se marcan como `null` (BYEs).

---

## 3. Estructura de Datos y Propagación de Nodos

Cada encuentro se representa como un objeto `PyramidMatch`. La estructura es un árbol binario implícito mapeado a un array plano para facilitar el renderizado.

### Atributos Clave:
- `nextMatchId`: Puntero al nodo padre.
- `winnerTargetSlot`: Indica si el ganador fluye al lado 'Azul' o 'Rojo' del padre.
- `byeWinner`: Flag booleano que automatiza el avance si un lado es `null`.

### Lógica de Avance Automático (BYEs)
```typescript
const countSeeds = (matchIdx: number, seedsPerMatch: number) => {
    const start = matchIdx * seedsPerMatch;
    let count = 0;
    for (let j = 0; j < seedsPerMatch; j++) {
        if (bracketSlots[matchOrder[start + j] - 1]) count++;
    }
    return count;
};

// Si un lado del encuentro tiene competidores y el otro no, es un BYE automático.
if (blueSeedsCount > 0 && redSeedsCount === 0) {
    match.winner = 'blue';
    match.byeWinner = 'blue';
    match.isReady = true;
}
```

---

## 4. Motor de Renderizado PDF (Geometría Vectorial)

El PDF se genera usando `jsPDF`. No es estático; se calcula dinámicamente según el número de fases ($C$) y la altura disponible ($H$).

### Cálculos de Coordenadas
- **Ancho de Columna (`colW`)**: $(Página - Margen) / C$.
- **Altura de Slot (`slotH`)**: $H / (MatchCount_{Phase})$.
- **Posición Vertical (`cardY`)**: $y + (rowIdx * slotH) + (slotH - CARD\_H) / 2$.

### Conectores de Llave (Lógica de Fork)
Se trazan tres segmentos de línea para cada match (excepto en la final):
1.  **Horizontal de Salida**: `(x + CARD_W, midY)` a `(x + CARD_W + offset, midY)`.
2.  **Vertical de Unión**: `(x + CARD_W + offset, midY)` a `(x + CARD_W + offset, nextMidY)`.
3.  **Horizontal de Entrada**: `(x + CARD_W + offset, nextMidY)` a `(nextColX, nextMidY)`.

### Renderizado de Nombres Multilínea (Teams/Pairs)
Para evitar el truncamiento de nombres largos en equipos, se utiliza:
```typescript
const blueLines = doc.splitTextToSize(name, CARD_W - 4);
doc.text(blueLines, x + 2, cardY + (CARD_H / 4) - (blueLines.length > 1 ? 1 : 0));
```
El sistema ajusta el `Y` de la delegación basándose en `blueLines.length` para evitar colisiones.

---

## 5. Algoritmo de Numeración de Encuentros

Para facilitar la logística de mesa, los encuentros se numeran cronológicamente por rondas, de la fase más lejana a la final, filtrando los BYEs.

```typescript
const matchesToNumber = allMatches
    .filter(m => !m.byeWinner)
    .sort((a, b) => {
        const wA = getRoundWeight(a.phase);
        const wB = getRoundWeight(b.phase);
        if (wA !== wB) return wB - wA; // Rondas de 32 antes de rondas de 16
        return allMatches.indexOf(a) - allMatches.indexOf(b); // Orden visual
    });
```

---

## 6. Sincronización y Estado (Tauri Bridge)

Toda actualización en la estructura de la pirámide (`updateCategory`) se envía al **Public Display Interface (PDI)** mediante un payload JSON.

**Eventos de Sincronización:**
- `PYRAMID_VIEW`: Envía la estructura completa de matches para renderizado SVG.
- `COMPETITION_START`: Inicializa el marcador para el match actual.
- `SCORE_UPDATE`: Propaga los puntos en tiempo real para visualización pública.

---
*Este documento es propiedad técnica de KalyoTKD. Versión 2.1 - Estabilizada.*

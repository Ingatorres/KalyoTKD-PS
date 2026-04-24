import React from 'react';
import { Category, Competitor, PyramidMatch } from '../types';

interface PyramidFinalResultsProps {
    category: Category;
}

export interface MedalWinner {
    place: number;
    medal: 'Oro' | 'Plata' | 'Bronce';
    competitor: Competitor | null;
}

/**
 * Determina los ganadores de medallas para una categoría de sistema piramidal.
 * En Poomsae, ambos perdedores de las semifinales reciben medalla de bronce.
 */
const getMedalWinners = (matches: PyramidMatch[]): MedalWinner[] => {
    const finalMatch = matches.find(m => m.phase === 'Final');
    const semifinalMatches = matches.filter(m => m.phase === 'Semifinal');

    let gold: Competitor | null = null;
    let silver: Competitor | null = null;
    const bronzes: (Competitor | null)[] = [];

    if (finalMatch && finalMatch.winner) {
        gold = finalMatch.winner === 'blue' ? finalMatch.competitorBlue : finalMatch.competitorRed;
        silver = finalMatch.winner === 'blue' ? finalMatch.competitorRed : finalMatch.competitorBlue;
    }

    semifinalMatches.forEach(match => {
        if (match.winner) {
            const loser = match.winner === 'blue' ? match.competitorRed : match.competitorBlue;
            // Asegurarse de que el perdedor de la semifinal no sea el que llegó a la final (plata)
            if (loser && loser.id !== silver?.id) {
                bronzes.push(loser);
            }
        }
    });

    // En caso de que no haya semifinales (categoría de 3 o 4), el perdedor de la final contra el campeón es bronce.
    // Esta lógica es un fallback, la principal es la de arriba.
    if (bronzes.length === 0 && semifinalMatches.length > 0 && silver) {
         const otherSemifinal = semifinalMatches.find(m => m.competitorBlue?.id !== gold?.id && m.competitorRed?.id !== gold?.id);
         if(otherSemifinal?.winner) {
            const loser = otherSemifinal.winner === 'blue' ? otherSemifinal.competitorRed : otherSemifinal.competitorBlue;
            if(loser) bronzes.push(loser);
         }
    }

    const winners: MedalWinner[] = [
        { place: 1, medal: 'Oro', competitor: gold },
        { place: 2, medal: 'Plata', competitor: silver },
    ];

    // Añadir los bronces, evitando duplicados
    const bronzeIds = new Set<string>();
    bronzes.forEach(b => {
        if (b && !bronzeIds.has(b.id)) {
            winners.push({ place: 3, medal: 'Bronce', competitor: b });
            bronzeIds.add(b.id);
        }
    });

    return winners;
};

export const PyramidFinalResults: React.FC<PyramidFinalResultsProps> = ({ category }) => {
    const medalWinners = getMedalWinners(category.pyramidMatches || []);

    const getPlaceLabel = (place: number) => {
        switch(place) {
            case 1: return '1er Lugar';
            case 2: return '2do Lugar';
            case 3: return '3er Lugar';
            default: return `${place}º Lugar`;
        }
    };

    return (
        <div className="space-y-8">
            {/* Tabla de Podio */}
            <div>
                <h3 className="text-2xl font-bold text-gray-800 mb-4 text-center">Podio Final</h3>
                <div className="overflow-x-auto">
                    <table className="min-w-full bg-white rounded-lg shadow">
                        <thead className="bg-gray-800 text-white">
                            <tr>
                                <th className="py-3 px-4 text-left">Puesto</th>
                                <th className="py-3 px-4 text-left">Medalla</th>
                                <th className="py-3 px-4 text-left">Competidor</th>
                                <th className="py-3 px-4 text-left">Delegación</th>
                            </tr>
                        </thead>
                        <tbody className="text-gray-700">
                            {medalWinners.map(({ place, medal, competitor }, index) => (
                                <tr key={index} className="border-b hover:bg-gray-50">
                                    <td className="py-3 px-4 font-semibold">{getPlaceLabel(place)}</td>
                                    <td className="py-3 px-4">{medal}</td>
                                    <td className="py-3 px-4">{competitor?.name || 'N/D'}</td>
                                    <td className="py-3 px-4">{competitor?.delegation || 'N/D'}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

/**
 * Función de utilidad que puede ser usada por el PDI para mostrar los resultados.
 * Se exporta para que otros módulos puedan usar la misma lógica de obtención de medallas.
 */
export const getPyramidMedalWinners = (matches: PyramidMatch[]): MedalWinner[] => {
    return getMedalWinners(matches);
};
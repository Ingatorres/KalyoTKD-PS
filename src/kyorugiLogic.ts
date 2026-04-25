export const getKyorugiAgeGroups = () => [
    'Festival Infantil (4-11)',
    'Pre-cadete C (6-7)',
    'Pre-cadete B (8-9)',
    'Pre-cadete A (10-11)',
    'Cadete (12-14)',
    'Junior (15-17)',
    'Mayores (17+)',
    'Senior Master 1 (35-44)',
    'Senior Master 2 (45-55)'
];

export const getKyorugiWeights = (ageGroup: string, gender: string, isPara: boolean): string[] => {
    if (isPara) {
        if (gender === 'Femenino') return ['-47kg', '-52kg', '-57kg', '-65kg', '+65kg'];
        if (gender === 'Masculino') return ['-58kg', '-63kg', '-70kg', '-80kg', '+80kg'];
        return ['Único'];
    }

    if (ageGroup === 'Pre-cadete A (10-11)') return ['-27kg', '-30kg', '-33kg', '-36kg', '-39kg', '-42kg', '-46kg', '-50kg', '-54kg', '+54kg'];
    if (ageGroup === 'Pre-cadete B (8-9)') return ['-21kg', '-24kg', '-27kg', '-30kg', '-33kg', '-36kg', '-39kg', '-42kg', '-46kg', '+46kg'];
    if (ageGroup === 'Pre-cadete C (6-7)') return ['-18kg', '-21kg', '-24kg', '-27kg', '-30kg', '-33kg', '-36kg', '-39kg', '-42kg', '+42kg'];
    
    if (ageGroup === 'Cadete (12-14)') {
        if (gender === 'Femenino') return ['Hasta 29kg', '-33kg', '-37kg', '-41kg', '-44kg', '-47kg', '-51kg', '-55kg', '-59kg', '+59kg'];
        if (gender === 'Masculino') return ['Hasta 33kg', '-37kg', '-41kg', '-45kg', '-49kg', '-53kg', '-57kg', '-61kg', '-65kg', '+65kg'];
    }

    if (ageGroup === 'Junior (15-17)') {
        if (gender === 'Femenino') return ['Hasta 42kg', '-44kg', '-46kg', '-49kg', '-52kg', '-55kg', '-59kg', '-63kg', '-68kg', '+68kg'];
        if (gender === 'Masculino') return ['Hasta 45kg', '-48kg', '-51kg', '-55kg', '-59kg', '-63kg', '-68kg', '-73kg', '-78kg', '+78kg'];
    }

    if (ageGroup === 'Mayores (17+)') {
        if (gender === 'Femenino') return ['Hasta 46kg', '-49kg', '-53kg', '-57kg', '-62kg', '-67kg', '-73kg', '+73kg'];
        if (gender === 'Masculino') return ['Hasta 54kg', '-58kg', '-63kg', '-68kg', '-74kg', '-80kg', '-87kg', '+87kg'];
    }

    return ['Único'];
};

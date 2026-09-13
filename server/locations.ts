/**
 * Canonical Nigerian Locations & Pricing Dataset for Server
 */

export interface NigerianStateData {
  name: string;
  code: string;
  capital: string;
  zone: string;
  majorCities: string[];
  defaultTerrain: string;
  regionalCostIndex: number;
}

export const NIGERIAN_STATES: NigerianStateData[] = [
  { name: 'Abia', code: 'AB', capital: 'Umuahia', zone: 'South East', majorCities: ['Aba', 'Umuahia', 'Ohafia'], defaultTerrain: 'Normal', regionalCostIndex: 0.98 },
  { name: 'Adamawa', code: 'AD', capital: 'Yola', zone: 'North East', majorCities: ['Yola', 'Jimeta', 'Mubi'], defaultTerrain: 'Hilly', regionalCostIndex: 0.95 },
  { name: 'Akwa Ibom', code: 'AK', capital: 'Uyo', zone: 'South South', majorCities: ['Uyo', 'Eket', 'Ikot Ekpene'], defaultTerrain: 'Coastal', regionalCostIndex: 1.04 },
  { name: 'Anambra', code: 'AN', capital: 'Awka', zone: 'South East', majorCities: ['Awka', 'Onitsha', 'Nnewi'], defaultTerrain: 'Normal', regionalCostIndex: 0.99 },
  { name: 'Bauchi', code: 'BA', capital: 'Bauchi', zone: 'North East', majorCities: ['Bauchi', 'Azare', 'Misau'], defaultTerrain: 'Normal', regionalCostIndex: 0.92 },
  { name: 'Bayelsa', code: 'BY', capital: 'Yenagoa', zone: 'South South', majorCities: ['Yenagoa', 'Brass', 'Ogbia'], defaultTerrain: 'Swamp', regionalCostIndex: 1.12 },
  { name: 'Benue', code: 'BN', capital: 'Makurdi', zone: 'North Central', majorCities: ['Makurdi', 'Gboko', 'Otukpo'], defaultTerrain: 'Normal', regionalCostIndex: 0.93 },
  { name: 'Borno', code: 'BO', capital: 'Maiduguri', zone: 'North East', majorCities: ['Maiduguri', 'Biu', 'Bama'], defaultTerrain: 'Normal', regionalCostIndex: 0.94 },
  { name: 'Cross River', code: 'CR', capital: 'Calabar', zone: 'South South', majorCities: ['Calabar', 'Ikom', 'Ogoja'], defaultTerrain: 'Coastal', regionalCostIndex: 1.02 },
  { name: 'Delta', code: 'DT', capital: 'Asaba', zone: 'South South', majorCities: ['Asaba', 'Warri', 'Ughelli'], defaultTerrain: 'Waterlogged', regionalCostIndex: 1.05 },
  { name: 'Ebonyi', code: 'EB', capital: 'Abakaliki', zone: 'South East', majorCities: ['Abakaliki', 'Afikpo', 'Onueke'], defaultTerrain: 'Normal', regionalCostIndex: 0.95 },
  { name: 'Edo', code: 'ED', capital: 'Benin City', zone: 'South South', majorCities: ['Benin City', 'Auchi', 'Ekpoma'], defaultTerrain: 'Normal', regionalCostIndex: 0.97 },
  { name: 'Ekiti', code: 'EK', capital: 'Ado-Ekiti', zone: 'South West', majorCities: ['Ado-Ekiti', 'Ikere-Ekiti'], defaultTerrain: 'Hilly', regionalCostIndex: 0.93 },
  { name: 'Enugu', code: 'EN', capital: 'Enugu', zone: 'South East', majorCities: ['Enugu', 'Nsukka', 'Awgu'], defaultTerrain: 'Hilly', regionalCostIndex: 0.97 },
  { name: 'FCT', code: 'FC', capital: 'Abuja', zone: 'North Central', majorCities: ['Abuja Central', 'Garki', 'Wuse', 'Maitama', 'Gwarinpa', 'Kubwa'], defaultTerrain: 'Hilly', regionalCostIndex: 1.08 },
  { name: 'Gombe', code: 'GO', capital: 'Gombe', zone: 'North East', majorCities: ['Gombe', 'Kaltungo', 'Billiri'], defaultTerrain: 'Hilly', regionalCostIndex: 0.93 },
  { name: 'Imo', code: 'IM', capital: 'Owerri', zone: 'South East', majorCities: ['Owerri', 'Orlu', 'Okigwe'], defaultTerrain: 'Normal', regionalCostIndex: 0.99 },
  { name: 'Jigawa', code: 'JI', capital: 'Dutse', zone: 'North West', majorCities: ['Dutse', 'Hadejia', 'Kazaure'], defaultTerrain: 'Normal', regionalCostIndex: 0.91 },
  { name: 'Kaduna', code: 'KD', capital: 'Kaduna', zone: 'North West', majorCities: ['Kaduna', 'Zaria', 'Kafanchan'], defaultTerrain: 'Normal', regionalCostIndex: 0.94 },
  { name: 'Kano', code: 'KN', capital: 'Kano', zone: 'North West', majorCities: ['Kano City', 'Wudil', 'Bichi'], defaultTerrain: 'Normal', regionalCostIndex: 0.93 },
  { name: 'Katsina', code: 'KT', capital: 'Katsina', zone: 'North West', majorCities: ['Katsina', 'Daura', 'Funtua'], defaultTerrain: 'Normal', regionalCostIndex: 0.92 },
  { name: 'Kebbi', code: 'KB', capital: 'Birnin Kebbi', zone: 'North West', majorCities: ['Birnin Kebbi', 'Argungu', 'Yauri'], defaultTerrain: 'Normal', regionalCostIndex: 0.91 },
  { name: 'Kogi', code: 'KG', capital: 'Lokoja', zone: 'North Central', majorCities: ['Lokoja', 'Okene', 'Kabba'], defaultTerrain: 'Hilly', regionalCostIndex: 0.93 },
  { name: 'Kwara', code: 'KW', capital: 'Ilorin', zone: 'North Central', majorCities: ['Ilorin', 'Offa', 'Omu-Aran'], defaultTerrain: 'Normal', regionalCostIndex: 0.93 },
  { name: 'Lagos', code: 'LA', capital: 'Ikeja', zone: 'South West', majorCities: ['Ikeja', 'Victoria Island', 'Lekki Phase 1', 'Ikoyi', 'Epe', 'Ikorodu'], defaultTerrain: 'Coastal', regionalCostIndex: 1.00 },
  { name: 'Nasarawa', code: 'NA', capital: 'Lafia', zone: 'North Central', majorCities: ['Lafia', 'Keffi', 'Mararaba', 'Karu'], defaultTerrain: 'Normal', regionalCostIndex: 0.96 },
  { name: 'Niger', code: 'NI', capital: 'Minna', zone: 'North Central', majorCities: ['Minna', 'Suleja', 'Bida'], defaultTerrain: 'Normal', regionalCostIndex: 0.94 },
  { name: 'Ogun', code: 'OG', capital: 'Abeokuta', zone: 'South West', majorCities: ['Abeokuta', 'Sagamu', 'Ijebu-Ode', 'Ota'], defaultTerrain: 'Normal', regionalCostIndex: 0.94 },
  { name: 'Ondo', code: 'ON', capital: 'Akure', zone: 'South West', majorCities: ['Akure', 'Ondo Town', 'Owo'], defaultTerrain: 'Normal', regionalCostIndex: 0.95 },
  { name: 'Osun', code: 'OS', capital: 'Osogbo', zone: 'South West', majorCities: ['Osogbo', 'Ile-Ife', 'Ilesa'], defaultTerrain: 'Normal', regionalCostIndex: 0.93 },
  { name: 'Oyo', code: 'OY', capital: 'Ibadan', zone: 'South West', majorCities: ['Ibadan', 'Ogbomoso', 'Oyo Town'], defaultTerrain: 'Normal', regionalCostIndex: 0.94 },
  { name: 'Plateau', code: 'PL', capital: 'Jos', zone: 'North Central', majorCities: ['Jos', 'Bukuru', 'Pankshin'], defaultTerrain: 'Hilly', regionalCostIndex: 0.95 },
  { name: 'Rivers', code: 'RI', capital: 'Port Harcourt', zone: 'South South', majorCities: ['Port Harcourt', 'Obio-Akpor', 'Bonny', 'Eleme'], defaultTerrain: 'Swamp', regionalCostIndex: 1.07 },
  { name: 'Sokoto', code: 'SO', capital: 'Sokoto', zone: 'North West', majorCities: ['Sokoto', 'Tambuwal', 'Wurno'], defaultTerrain: 'Normal', regionalCostIndex: 0.92 },
  { name: 'Taraba', code: 'TA', capital: 'Jalingo', zone: 'North East', majorCities: ['Jalingo', 'Wukari', 'Bali'], defaultTerrain: 'Hilly', regionalCostIndex: 0.94 },
  { name: 'Yobe', code: 'YO', capital: 'Damaturu', zone: 'North East', majorCities: ['Damaturu', 'Potiskum', 'Gashua'], defaultTerrain: 'Normal', regionalCostIndex: 0.91 },
  { name: 'Zamfara', code: 'ZA', capital: 'Gusau', zone: 'North West', majorCities: ['Gusau', 'Kaura Namoda'], defaultTerrain: 'Normal', regionalCostIndex: 0.91 }
];

export function getRegionalRateMultiplier(location?: string, stateName?: string): number {
  if (stateName) {
    const s = NIGERIAN_STATES.find(st => st.name.toLowerCase() === stateName.trim().toLowerCase());
    if (s) return s.regionalCostIndex;
  }
  if (location) {
    const loc = location.toLowerCase();
    for (const st of NIGERIAN_STATES) {
      if (loc.includes(st.name.toLowerCase()) || loc.includes(st.capital.toLowerCase())) {
        return st.regionalCostIndex;
      }
      for (const city of st.majorCities) {
        if (loc.includes(city.toLowerCase())) {
          return st.regionalCostIndex;
        }
      }
    }
  }
  return 1.00;
}

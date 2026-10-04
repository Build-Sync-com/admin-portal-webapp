export const SITE_STATUSES = ['Planning', 'Active', 'On Hold', 'Completed']

export const SITE_ROLES = [
  'Project Manager',
  'Planning Engineer',
  'Engineer',
  'Assistant Engineer',
  'QA/QC Engineer',
  'Quantity Surveyor',
  'Admin (Site)',
  'Store Keeper',
  'HR',
  'Management',
  'Consultant Engineer',
  'Consultant QA/QC Engineer',
  'Client',
]

export const PROJECT_TYPES = ['Apartment', 'Commercial', 'Residential', 'Mixed', 'Infrastructure']

export const ID_TYPES = ['NIC', 'Passport']

export const SL_PROVINCES = [
  'Western',
  'Central',
  'Southern',
  'Northern',
  'Eastern',
  'North Western',
  'North Central',
  'Uva',
  'Sabaragamuwa',
]

export const SL_DISTRICTS = [
  'Colombo',
  'Gampaha',
  'Kalutara',
  'Kandy',
  'Matale',
  'Nuwara Eliya',
  'Galle',
  'Matara',
  'Hambantota',
  'Jaffna',
  'Kilinochchi',
  'Mannar',
  'Vavuniya',
  'Mullaitivu',
  'Batticaloa',
  'Ampara',
  'Trincomalee',
  'Kurunegala',
  'Puttalam',
  'Anuradhapura',
  'Polonnaruwa',
  'Badulla',
  'Monaragala',
  'Ratnapura',
  'Kegalle',
]

export const COUNTRIES = [
  'Afghanistan', 'Albania', 'Algeria', 'Andorra', 'Angola', 'Argentina', 'Armenia', 'Australia', 'Austria',
  'Azerbaijan', 'Bahamas', 'Bahrain', 'Bangladesh', 'Barbados', 'Belarus', 'Belgium', 'Belize', 'Benin', 'Bhutan',
  'Bolivia', 'Bosnia and Herzegovina', 'Botswana', 'Brazil', 'Brunei', 'Bulgaria', 'Burkina Faso', 'Burundi',
  'Cambodia', 'Cameroon', 'Canada', 'Cape Verde', 'Central African Republic', 'Chad', 'Chile', 'China', 'Colombia',
  'Comoros', 'Congo', 'Costa Rica', 'Croatia', 'Cuba', 'Cyprus', 'Czech Republic', 'Denmark', 'Djibouti',
  'Dominica', 'Dominican Republic', 'Ecuador', 'Egypt', 'El Salvador', 'Equatorial Guinea', 'Eritrea', 'Estonia',
  'Eswatini', 'Ethiopia', 'Fiji', 'Finland', 'France', 'Gabon', 'Gambia', 'Georgia', 'Germany', 'Ghana', 'Greece',
  'Grenada', 'Guatemala', 'Guinea', 'Guinea-Bissau', 'Guyana', 'Haiti', 'Honduras', 'Hungary', 'Iceland', 'India',
  'Indonesia', 'Iran', 'Iraq', 'Ireland', 'Israel', 'Italy', 'Ivory Coast', 'Jamaica', 'Japan', 'Jordan',
  'Kazakhstan', 'Kenya', 'Kiribati', 'Kuwait', 'Kyrgyzstan', 'Laos', 'Latvia', 'Lebanon', 'Lesotho', 'Liberia',
  'Libya', 'Liechtenstein', 'Lithuania', 'Luxembourg', 'Madagascar', 'Malawi', 'Malaysia', 'Maldives', 'Mali',
  'Malta', 'Marshall Islands', 'Mauritania', 'Mauritius', 'Mexico', 'Micronesia', 'Moldova', 'Monaco', 'Mongolia',
  'Montenegro', 'Morocco', 'Mozambique', 'Myanmar', 'Namibia', 'Nauru', 'Nepal', 'Netherlands', 'New Zealand',
  'Nicaragua', 'Niger', 'Nigeria', 'North Korea', 'North Macedonia', 'Norway', 'Oman', 'Pakistan', 'Palau',
  'Palestine', 'Panama', 'Papua New Guinea', 'Paraguay', 'Peru', 'Philippines', 'Poland', 'Portugal', 'Qatar',
  'Romania', 'Russia', 'Rwanda', 'Saint Kitts and Nevis', 'Saint Lucia', 'Saint Vincent and the Grenadines',
  'Samoa', 'San Marino', 'Sao Tome and Principe', 'Saudi Arabia', 'Senegal', 'Serbia', 'Seychelles', 'Sierra Leone',
  'Singapore', 'Slovakia', 'Slovenia', 'Solomon Islands', 'Somalia', 'South Africa', 'South Korea', 'South Sudan',
  'Spain', 'Sri Lanka', 'Sudan', 'Suriname', 'Sweden', 'Switzerland', 'Syria', 'Taiwan', 'Tajikistan', 'Tanzania',
  'Thailand', 'Timor-Leste', 'Togo', 'Tonga', 'Trinidad and Tobago', 'Tunisia', 'Turkey', 'Turkmenistan', 'Tuvalu',
  'Uganda', 'Ukraine', 'United Arab Emirates', 'United Kingdom', 'United States', 'Uruguay', 'Uzbekistan',
  'Vanuatu', 'Vatican City', 'Venezuela', 'Vietnam', 'Yemen', 'Zambia', 'Zimbabwe',
]

// International dialing codes, keyed by the country names used in COUNTRIES above.
export const COUNTRY_DIAL_CODES = {
  Afghanistan: '93', Albania: '355', Algeria: '213', Andorra: '376', Angola: '244', Argentina: '54',
  Armenia: '374', Australia: '61', Austria: '43', Azerbaijan: '994', Bahamas: '1', Bahrain: '973',
  Bangladesh: '880', Barbados: '1', Belarus: '375', Belgium: '32', Belize: '501', Benin: '229', Bhutan: '975',
  Bolivia: '591', 'Bosnia and Herzegovina': '387', Botswana: '267', Brazil: '55', Brunei: '673', Bulgaria: '359',
  'Burkina Faso': '226', Burundi: '257', Cambodia: '855', Cameroon: '237', Canada: '1', 'Cape Verde': '238',
  'Central African Republic': '236', Chad: '235', Chile: '56', China: '86', Colombia: '57', Comoros: '269',
  Congo: '242', 'Costa Rica': '506', Croatia: '385', Cuba: '53', Cyprus: '357', 'Czech Republic': '420',
  Denmark: '45', Djibouti: '253', Dominica: '1', 'Dominican Republic': '1', Ecuador: '593', Egypt: '20',
  'El Salvador': '503', 'Equatorial Guinea': '240', Eritrea: '291', Estonia: '372', Eswatini: '268',
  Ethiopia: '251', Fiji: '679', Finland: '358', France: '33', Gabon: '241', Gambia: '220', Georgia: '995',
  Germany: '49', Ghana: '233', Greece: '30', Grenada: '1', Guatemala: '502', Guinea: '224', 'Guinea-Bissau': '245',
  Guyana: '592', Haiti: '509', Honduras: '504', Hungary: '36', Iceland: '354', India: '91', Indonesia: '62',
  Iran: '98', Iraq: '964', Ireland: '353', Israel: '972', Italy: '39', 'Ivory Coast': '225', Jamaica: '1',
  Japan: '81', Jordan: '962', Kazakhstan: '7', Kenya: '254', Kiribati: '686', Kuwait: '965', Kyrgyzstan: '996',
  Laos: '856', Latvia: '371', Lebanon: '961', Lesotho: '266', Liberia: '231', Libya: '218', Liechtenstein: '423',
  Lithuania: '370', Luxembourg: '352', Madagascar: '261', Malawi: '265', Malaysia: '60', Maldives: '960',
  Mali: '223', Malta: '356', 'Marshall Islands': '692', Mauritania: '222', Mauritius: '230', Mexico: '52',
  Micronesia: '691', Moldova: '373', Monaco: '377', Mongolia: '976', Montenegro: '382', Morocco: '212',
  Mozambique: '258', Myanmar: '95', Namibia: '264', Nauru: '674', Nepal: '977', Netherlands: '31',
  'New Zealand': '64', Nicaragua: '505', Niger: '227', Nigeria: '234', 'North Korea': '850',
  'North Macedonia': '389', Norway: '47', Oman: '968', Pakistan: '92', Palau: '680', Palestine: '970',
  Panama: '507', 'Papua New Guinea': '675', Paraguay: '595', Peru: '51', Philippines: '63', Poland: '48',
  Portugal: '351', Qatar: '974', Romania: '40', Russia: '7', Rwanda: '250', 'Saint Kitts and Nevis': '1',
  'Saint Lucia': '1', 'Saint Vincent and the Grenadines': '1', Samoa: '685', 'San Marino': '378',
  'Sao Tome and Principe': '239', 'Saudi Arabia': '966', Senegal: '221', Serbia: '381', Seychelles: '248',
  'Sierra Leone': '232', Singapore: '65', Slovakia: '421', Slovenia: '386', 'Solomon Islands': '677',
  Somalia: '252', 'South Africa': '27', 'South Korea': '82', 'South Sudan': '211', Spain: '34', 'Sri Lanka': '94',
  Sudan: '249', Suriname: '597', Sweden: '46', Switzerland: '41', Syria: '963', Taiwan: '886', Tajikistan: '992',
  Tanzania: '255', Thailand: '66', 'Timor-Leste': '670', Togo: '228', Tonga: '676', 'Trinidad and Tobago': '1',
  Tunisia: '216', Turkey: '90', Turkmenistan: '993', Tuvalu: '688', Uganda: '256', Ukraine: '380',
  'United Arab Emirates': '971', 'United Kingdom': '44', 'United States': '1', Uruguay: '598', Uzbekistan: '998',
  Vanuatu: '678', 'Vatican City': '379', Venezuela: '58', Vietnam: '84', Yemen: '967', Zambia: '260',
  Zimbabwe: '263',
}

// Builds a telephone placeholder from the selected country: dial code + masked digits.
export function getPhonePlaceholder(country) {
  const code = COUNTRY_DIAL_CODES[country]
  return code ? `+${code} XX XXX XXXX` : '+XX XX XXX XXXX'
}

// Same mask as getPhonePlaceholder but without the dial code, for use next to a
// separate country-code dropdown.
export function getLocalPhonePlaceholder() {
  return 'XX XXX XXXX'
}

export const STATUS_STYLES = {
  Planning: 'bg-amber-50 text-amber-700',
  Active: 'bg-emerald-50 text-emerald-700',
  'On Hold': 'bg-gray-100 text-gray-600',
  Completed: 'bg-blue-50 text-blue-700',
}

export function generateProjectId(existingCount) {
  return `PRJ-${String(existingCount + 1).padStart(4, '0')}`
}

export function getShortLocation(site) {
  return [site.city, site.district].filter(Boolean).join(', ')
}

export function getFullAddress(site) {
  return [site.siteAddress, site.city, site.district, site.province, site.country].filter(Boolean).join(', ')
}

export function calculateDuration(startDate, endDate) {
  if (!startDate || !endDate) return ''
  const start = new Date(startDate)
  const end = new Date(endDate)
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || end < start) return ''

  let months = (end.getFullYear() - start.getFullYear()) * 12 + (end.getMonth() - start.getMonth())
  let days = end.getDate() - start.getDate()
  if (days < 0) {
    months -= 1
    days += new Date(end.getFullYear(), end.getMonth(), 0).getDate()
  }

  const years = Math.floor(months / 12)
  const remMonths = months % 12
  const parts = []
  if (years) parts.push(`${years} yr${years > 1 ? 's' : ''}`)
  if (remMonths) parts.push(`${remMonths} mo${remMonths > 1 ? 's' : ''}`)
  if (days || parts.length === 0) parts.push(`${days} day${days !== 1 ? 's' : ''}`)
  return parts.join(' ')
}

export const sites = [
  {
    id: 'site-1',
    projectId: 'PRJ-0001',
    name: 'Riverside Tower',
    projectType: 'Mixed',
    clientName: 'Lanka Realty Group',
    contractRefNo: 'CR-2026-014',
    consultantName: 'Horizon Consulting Engineers',
    siteAddress: '45 Marine Drive',
    city: 'Colombo',
    district: 'Colombo',
    province: 'Western',
    country: 'Sri Lanka',
    status: 'Active',
    startDate: '2026-01-12',
    completionDate: '2026-11-30',
    initialContractValue: 450000000,
    telephone: '011-2345678',
    siteEmail: 'riverside.tower@buildsync.lk',
    description: 'Twelve-storey mixed-use tower with retail podium.',
    assignedUsers: [
      {
        id: 'a1',
        name: 'Nadeesha Perera',
        username: 'nadeesha.p',
        role: 'Project Manager',
        telephone: '+94 77 123 4567',
        idType: 'NIC',
        idNumber: '199012345678',
        country: 'Sri Lanka',
        homeTown: 'Kandy',
        assignedDate: '2026-01-15',
      },
      {
        id: 'a2',
        name: 'Kasun Fernando',
        username: 'kasun.f',
        role: 'Engineer',
        telephone: '+94 71 234 5678',
        idType: 'NIC',
        idNumber: '198523456789',
        country: 'Sri Lanka',
        homeTown: 'Galle',
        assignedDate: '2026-01-20',
      },
    ],
  },
  {
    id: 'site-2',
    projectId: 'PRJ-0002',
    name: 'Galle Road Interchange',
    projectType: 'Infrastructure',
    clientName: 'Road Development Authority',
    contractRefNo: 'CR-2026-021',
    consultantName: 'Pathway Engineering Consultants',
    siteAddress: 'Galle Road, KM 42',
    city: 'Galle',
    district: 'Galle',
    province: 'Southern',
    country: 'Sri Lanka',
    status: 'Planning',
    startDate: '2026-03-01',
    completionDate: '2027-02-28',
    initialContractValue: 1200000000,
    telephone: '091-2234567',
    siteEmail: 'galle.interchange@buildsync.lk',
    description: 'Flyover and interchange upgrade along Galle Road.',
    assignedUsers: [],
  },
  {
    id: 'site-3',
    projectId: 'PRJ-0003',
    name: 'Kandy Hillside Residences',
    projectType: 'Residential',
    clientName: 'Hillside Homes Pvt Ltd',
    contractRefNo: 'CR-2025-098',
    consultantName: 'Summit Design Associates',
    siteAddress: 'Hantana Road',
    city: 'Kandy',
    district: 'Kandy',
    province: 'Central',
    country: 'Sri Lanka',
    status: 'On Hold',
    startDate: '2025-08-05',
    completionDate: '2026-06-30',
    initialContractValue: 180000000,
    telephone: '081-2223344',
    siteEmail: 'kandy.hillside@buildsync.lk',
    description: 'Eighteen-unit hillside residential development.',
    assignedUsers: [
      {
        id: 'a3',
        name: 'Ruwan Jayasuriya',
        username: 'ruwan.j',
        role: 'QA/QC Engineer',
        telephone: '+94 76 345 6789',
        idType: 'NIC',
        idNumber: '197934567890',
        country: 'Sri Lanka',
        homeTown: 'Matara',
        assignedDate: '2025-08-10',
      },
    ],
  },
  {
    id: 'site-4',
    projectId: 'PRJ-0004',
    name: 'Negombo Warehouse Complex',
    projectType: 'Commercial',
    clientName: 'Ceylon Logistics',
    contractRefNo: 'CR-2025-033',
    consultantName: 'Northline Engineering',
    siteAddress: 'Colombo Road',
    city: 'Negombo',
    district: 'Gampaha',
    province: 'Western',
    country: 'Sri Lanka',
    status: 'Completed',
    startDate: '2025-02-01',
    completionDate: '2025-12-15',
    initialContractValue: 95000000,
    telephone: '031-2245566',
    siteEmail: 'negombo.warehouse@buildsync.lk',
    description: 'Three-block warehouse and logistics yard.',
    assignedUsers: [
      {
        id: 'a4',
        name: 'Malsha Kumari',
        username: 'malsha.k',
        role: 'Project Manager',
        telephone: '+94 70 456 7890',
        idType: 'NIC',
        idNumber: '199245678901',
        country: 'Sri Lanka',
        homeTown: 'Negombo',
        assignedDate: '2025-02-05',
      },
      {
        id: 'a5',
        name: 'Dilan Silva',
        username: 'dilan.s',
        role: 'Store Keeper',
        telephone: '+94 72 567 8901',
        idType: 'Passport',
        idNumber: 'N1234567',
        country: 'Sri Lanka',
        homeTown: 'Colombo',
        assignedDate: '2025-02-10',
      },
    ],
  },
]

// To Dentro, abas Universidades, Campi e polos e Cursos - amostra (linhas 44 a 55).
export const universities = [
  {"id": "puc-sp", "acronym": "PUC-SP", "name": "Pontifícia Universidade Católica de São Paulo", "category": "Privada", "tuition": "Paga (varia por curso)", "description": "Universidade privada com campi na capital paulista e em Sorocaba, com graduação em diferentes áreas.", "website": "https://www.pucsp.br/", "public": false, "free": false, "city": "São Paulo", "state": "SP", "courses": [], "periods": [], "photos": [], "admissionMethods": [], "campusIds": []},
  {"id": "fiap", "acronym": "FIAP", "name": "Faculdade de Informática e Administração Paulista", "category": "Privada", "tuition": "Paga (varia por curso e modalidade)", "description": "Instituição privada com unidades em São Paulo, voltada à tecnologia e aos negócios, com graduação presencial, online e semipresencial.", "website": "https://www.fiap.com.br/", "public": false, "free": false, "city": "São Paulo", "state": "SP", "courses": [], "periods": [], "photos": [], "admissionMethods": [], "campusIds": []},
];

export const campuses = [
  ["puc-sp", "Monte Alegre / Perdizes", "São Paulo", "SP", -23.537965, -46.671244],
  ["puc-sp", "Consolação / Marquês de Paranaguá", "São Paulo", "SP", -23.549071, -46.649478],
  ["puc-sp", "Sorocaba", "Sorocaba", "SP", -23.510019, -47.456245],
  ["fiap", "Aclimação (unidades 1222 e 1264)", "São Paulo", "SP", -23.574062, -46.623167],
  ["fiap", "Paulista", "São Paulo", "SP", -23.564084, -46.652387],
];

export const courseRows = [
  ["fiap", "Aclimação", "Administração", "Negócios", "Bacharelado", "Matutino", 8, "50 vagas / ano", 1840, "https://www.fiap.com.br/graduacao/bacharelado/administracao/"],
  ["fiap", "Aclimação", "Administração", "Negócios", "Bacharelado", "Noturno", 8, "100 vagas / ano", 2280, "https://www.fiap.com.br/graduacao/bacharelado/administracao/"],
  ["fiap", "Aclimação", "Engenharia de Software", "Computação", "Bacharelado", "Matutino", 8, "200 vagas / ano", 3310, "https://www.fiap.com.br/graduacao/bacharelado/engenharia-de-software/"],
  ["fiap", "Aclimação", "Engenharia de Software", "Computação", "Bacharelado", "Noturno", 8, "250 vagas / ano", 3310, "https://www.fiap.com.br/graduacao/bacharelado/engenharia-de-software/"],
  ["fiap", "Paulista", "Engenharia de Software", "Computação", "Bacharelado", "Matutino", 8, "200 vagas / ano", 3310, "https://www.fiap.com.br/graduacao/bacharelado/engenharia-de-software/"],
  ["fiap", "Paulista", "Engenharia de Software", "Computação", "Bacharelado", "Noturno", 8, "250 vagas / ano", 3310, "https://www.fiap.com.br/graduacao/bacharelado/engenharia-de-software/"],
  ["puc-sp", "Monte Alegre", "Administração", "Negócios", "Bacharelado", "Matutino", 8, "100 vagas / ano", 3450, "https://www.pucsp.br/graduacao/administracao#curso"],
  ["puc-sp", "Consolação", "Ciência da Computação", "Computação", "Bacharelado", "Matutino", 8, "60 vagas / ano", 3600, "https://www.pucsp.br/graduacao/ciencia-da-computacao#curso"],
  ["puc-sp", "Monte Alegre", "Direito", "Humanas", "Bacharelado", "Matutino ou noturno", 10, "510 vagas / ano", 5372, "https://www.pucsp.br/graduacao/direito#curso"],
  ["puc-sp", "Sorocaba", "Enfermagem", "Saúde", "Bacharelado", "Matutino", 10, "6 vagas / ano", 2150, "https://www.pucsp.br/graduacao/enfermagem"],
  ["puc-sp", "Marquês de Paranaguá", "Engenharia Civil", "Exatas", "Bacharelado", "Noturno", 10, "30 vagas / ano", 2950, "https://www.pucsp.br/graduacao/engenharia-civil"],
  ["puc-sp", "Monte Alegre", "Jornalismo", "Humanas", "Bacharelado", "Matutino, noturno ou vespertino", 8, "100 vagas / ano", 3993, "https://www.pucsp.br/graduacao/jornalismo#curso"],
];

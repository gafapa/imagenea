const FALLBACK_LOCALE = 'en'

function localized(map, language) {
  return map[language] ?? map[FALLBACK_LOCALE] ?? ''
}

export const AI_PROVIDERS = {
  ollama: {
    defaultUrl: 'http://localhost:11434',
    defaultModel: 'llama3.2',
    needsKey: false,
    label: {
      es: 'Ollama (local)',
      en: 'Ollama (local)',
      fr: 'Ollama (local)',
      de: 'Ollama (lokal)',
      pt: 'Ollama (local)',
      gl: 'Ollama (local)',
      ca: 'Ollama (local)',
      eu: 'Ollama (lokala)',
    },
  },
  lmstudio: {
    defaultUrl: 'http://localhost:1234',
    defaultModel: 'local-model',
    needsKey: false,
    label: {
      es: 'LM Studio (local)',
      en: 'LM Studio (local)',
      fr: 'LM Studio (local)',
      de: 'LM Studio (lokal)',
      pt: 'LM Studio (local)',
      gl: 'LM Studio (local)',
      ca: 'LM Studio (local)',
      eu: 'LM Studio (lokala)',
    },
  },
  openrouter: {
    defaultUrl: '',
    defaultModel: 'meta-llama/llama-3.2-3b-instruct:free',
    needsKey: true,
    label: {
      es: 'OpenRouter (nube)',
      en: 'OpenRouter (cloud)',
      fr: 'OpenRouter (cloud)',
      de: 'OpenRouter (Cloud)',
      pt: 'OpenRouter (cloud)',
      gl: 'OpenRouter (nube)',
      ca: 'OpenRouter (núvol)',
      eu: 'OpenRouter (hodeia)',
    },
  },
}

export const IMAGE_PROVIDERS = {
  all: {
    free: true,
    label: {
      es: 'Todos los gratuitos',
      en: 'All free sources',
      fr: 'Toutes les sources gratuites',
      de: 'Alle freien Quellen',
      pt: 'Todas as fontes gratuitas',
      gl: 'Todas as fontes gratuítas',
      ca: 'Totes les fonts gratuïtes',
      eu: 'Doako iturri guztiak',
    },
    hint: {
      es: 'Busca en paralelo en Openverse, Wikimedia, NASA, iNaturalist y GBIF.',
      en: 'Searches Openverse, Wikimedia, NASA, iNaturalist, and GBIF in parallel.',
      fr: 'Recherche Openverse, Wikimedia, NASA, iNaturalist et GBIF en parallèle.',
      de: 'Durchsucht Openverse, Wikimedia, NASA, iNaturalist und GBIF parallel.',
      pt: 'Pesquisa Openverse, Wikimedia, NASA, iNaturalist e GBIF em paralelo.',
      gl: 'Busca en paralelo en Openverse, Wikimedia, NASA, iNaturalist e GBIF.',
      ca: 'Cerca en paral·lel a Openverse, Wikimedia, NASA, iNaturalist i GBIF.',
      eu: 'Openverse, Wikimedia, NASA, iNaturalist eta GBIF paraleloan bilatzen ditu.',
    },
  },
  openverse: { free: true, label: { en: 'Openverse' }, hint: { en: 'No API key needed. Large open image catalog.' } },
  wikimedia: { free: true, label: { en: 'Wikimedia Commons' }, hint: { en: 'No API key needed. Good for encyclopedic and archival imagery.' } },
  nasa: { free: true, label: { en: 'NASA Images' }, hint: { en: 'No API key needed. Space, science, and technology imagery.' } },
  inaturalist: { free: true, label: { en: 'iNaturalist' }, hint: { en: 'No API key needed. Nature and biodiversity photos.' } },
  gbif: { free: true, label: { en: 'GBIF' }, hint: { en: 'No API key needed. Biodiversity and specimen imagery.' } },
  allart: {
    free: true,
    label: {
      es: 'Todos los museos',
      en: 'All museums',
      fr: 'Tous les musées',
      de: 'Alle Museen',
      pt: 'Todos os museus',
      gl: 'Todos os museos',
      ca: 'Tots els museus',
      eu: 'Museo guztiak',
    },
    hint: {
      en: 'Searches Art Institute of Chicago, Cleveland Museum of Art, and Rijksmuseum when configured.',
      es: 'Busca en Art Institute of Chicago, Cleveland Museum of Art y Rijksmuseum cuando está configurado.',
      fr: 'Recherche dans Art Institute of Chicago, Cleveland Museum of Art et Rijksmuseum lorsqu’il est configuré.',
      de: 'Durchsucht Art Institute of Chicago, Cleveland Museum of Art und Rijksmuseum, wenn konfiguriert.',
      pt: 'Pesquisa no Art Institute of Chicago, Cleveland Museum of Art e Rijksmuseum quando configurado.',
      gl: 'Busca no Art Institute of Chicago, Cleveland Museum of Art e Rijksmuseum cando está configurado.',
      ca: 'Cerca a l’Art Institute of Chicago, Cleveland Museum of Art i Rijksmuseum quan està configurat.',
      eu: 'Art Institute of Chicago, Cleveland Museum of Art eta Rijksmuseum-en bilatzen du, konfiguratuta badago.',
    },
  },
  artic: { free: true, label: { en: 'Art Institute Chicago' }, hint: { en: 'No API key needed. Open-access museum works.' } },
  cleveland: { free: true, label: { en: 'Cleveland Museum of Art' }, hint: { en: 'No API key needed. Open-access museum collection.' } },
  rijksmuseum: { free: false, label: { en: 'Rijksmuseum' }, hint: { en: 'Free API key required from data.rijksmuseum.nl.' } },
  prado: { free: false, label: { en: 'Museo del Prado' }, hint: { en: 'Uses a Europeana API key to search Prado works.' } },
  europeana: { free: false, label: { en: 'Europeana' }, hint: { en: 'Free API key required from pro.europeana.eu.' } },
  google: { free: false, cx: true, label: { en: 'Google Images' }, hint: { en: 'Requires both an API key and a Programmable Search Engine CX.' } },
  pexels: { free: false, label: { en: 'Pexels' }, hint: { en: 'Free API key available at pexels.com/api.' } },
  pixabay: { free: false, label: { en: 'Pixabay' }, hint: { en: 'Free API key available at pixabay.com/api.' } },
  unsplash: { free: false, label: { en: 'Unsplash' }, hint: { en: 'Free access key available at unsplash.com/developers.' } },
}

export const AI_GUIDES = {
  openrouter: {
    title: {
      es: 'Cómo obtener la API key de OpenRouter',
      en: 'How to get an OpenRouter API key',
      fr: 'Comment obtenir une clé API OpenRouter',
      de: 'So bekommst du einen OpenRouter-API-Schlüssel',
      pt: 'Como obter uma chave API do OpenRouter',
      gl: 'Como obter unha API key de OpenRouter',
      ca: 'Com obtenir una clau API d’OpenRouter',
      eu: 'Nola lortu OpenRouter API gakoa',
    },
    note: {
      es: 'Los modelos con ":free" no consumen créditos.',
      en: 'Models tagged with ":free" do not consume credits.',
      fr: 'Les modèles marqués ":free" ne consomment pas de crédits.',
      de: 'Modelle mit ":free" verbrauchen keine Credits.',
      pt: 'Modelos com ":free" não consomem créditos.',
      gl: 'Os modelos con ":free" non consumen créditos.',
      ca: 'Els models amb ":free" no consumeixen crèdits.',
      eu: '":free" duten ereduek ez dute krediturik kontsumitzen.',
    },
    modelUrl: 'https://openrouter.ai/models?q=free',
    modelLabel: {
      es: 'Ver modelos gratuitos',
      en: 'View free models',
      fr: 'Voir les modèles gratuits',
      de: 'Kostenlose Modelle ansehen',
      pt: 'Ver modelos gratuitos',
      gl: 'Ver modelos gratuítos',
      ca: 'Veure models gratuïts',
      eu: 'Ikusi doako ereduak',
    },
    steps: [
      { url: 'https://openrouter.ai/sign-up', text: { en: 'Create a free account', es: 'Crea una cuenta gratuita', fr: 'Créez un compte gratuit', de: 'Erstelle ein kostenloses Konto', pt: 'Crie uma conta gratuita', gl: 'Crea unha conta gratuíta', ca: 'Crea un compte gratuït', eu: 'Sortu doako kontu bat' } },
      { url: 'https://openrouter.ai/keys', text: { en: 'Open the keys page', es: 'Abre la página de claves', fr: 'Ouvrez la page des clés', de: 'Öffne die Schlüsselseite', pt: 'Abra a página de chaves', gl: 'Abre a páxina de claves', ca: 'Obre la pàgina de claus', eu: 'Ireki gakoen orria' } },
      { text: { en: 'Create a new key and copy it', es: 'Crea una nueva clave y cópiala', fr: 'Créez une nouvelle clé et copiez-la', de: 'Erstelle einen neuen Schlüssel und kopiere ihn', pt: 'Crie uma nova chave e copie-a', gl: 'Crea unha nova clave e cópiaa', ca: 'Crea una clau nova i copia-la', eu: 'Sortu gako berria eta kopiatu' } },
      { text: { en: 'Paste the key into the field above', es: 'Pega la clave en el campo superior', fr: 'Collez la clé dans le champ ci-dessus', de: 'Füge den Schlüssel oben ein', pt: 'Cole a chave no campo acima', gl: 'Pega a clave no campo superior', ca: 'Enganxa la clau al camp superior', eu: 'Itsatsi gakoa goiko eremuan' } },
    ],
  },
}

export const IMAGE_GUIDES = {
  rijksmuseum: {
    title: { en: 'How to get a Rijksmuseum API key', es: 'Cómo obtener la API key de Rijksmuseum', fr: 'Comment obtenir une clé API Rijksmuseum', de: 'So bekommst du einen Rijksmuseum-API-Schlüssel', pt: 'Como obter uma chave API do Rijksmuseum', gl: 'Como obter unha API key de Rijksmuseum', ca: 'Com obtenir una clau API del Rijksmuseum', eu: 'Nola lortu Rijksmuseum API gakoa' },
    steps: [
      { url: 'https://data.rijksmuseum.nl/object-metadata/api/', text: { en: 'Open the Rijksmuseum data portal', es: 'Abre el portal de datos de Rijksmuseum', fr: 'Ouvrez le portail de données du Rijksmuseum', de: 'Öffne das Rijksmuseum-Datenportal', pt: 'Abra o portal de dados do Rijksmuseum', gl: 'Abre o portal de datos de Rijksmuseum', ca: 'Obre el portal de dades del Rijksmuseum', eu: 'Ireki Rijksmuseum datuen ataria' } },
      { text: { en: 'Register for free and confirm your email', es: 'Regístrate gratis y confirma tu email', fr: 'Inscrivez-vous gratuitement et confirmez votre e-mail', de: 'Registriere dich kostenlos und bestätige deine E-Mail', pt: 'Registe-se gratuitamente e confirme o email', gl: 'Rexístrate gratis e confirma o teu correo', ca: 'Registra’t gratis i confirma el correu', eu: 'Erregistratu doan eta baieztatu emaila' } },
      { text: { en: 'Copy the API key from your profile', es: 'Copia la API key de tu perfil', fr: 'Copiez la clé API depuis votre profil', de: 'Kopiere den API-Schlüssel aus deinem Profil', pt: 'Copie a chave API do perfil', gl: 'Copia a API key do teu perfil', ca: 'Copia la clau API del teu perfil', eu: 'Kopiatu API gakoa zure profiletik' } },
    ],
  },
  europeana: {
    title: { en: 'How to get a Europeana API key', es: 'Cómo obtener la API key de Europeana', fr: 'Comment obtenir une clé API Europeana', de: 'So bekommst du einen Europeana-API-Schlüssel', pt: 'Como obter uma chave API da Europeana', gl: 'Como obter unha API key de Europeana', ca: 'Com obtenir una clau API d’Europeana', eu: 'Nola lortu Europeana API gakoa' },
    note: { en: 'The same key also works for Museo del Prado.', es: 'La misma clave también sirve para Museo del Prado.', fr: 'La même clé fonctionne aussi pour le Museo del Prado.', de: 'Derselbe Schlüssel funktioniert auch für das Museo del Prado.', pt: 'A mesma chave também funciona para o Museo del Prado.', gl: 'A mesma clave tamén serve para o Museo del Prado.', ca: 'La mateixa clau també funciona per al Museo del Prado.', eu: 'Gako bera Museo del Prado-rako ere balio du.' },
    steps: [
      { url: 'https://pro.europeana.eu/page/get-api', text: { en: 'Open the Europeana developer page', es: 'Abre la página de desarrolladores de Europeana', fr: 'Ouvrez la page développeur de Europeana', de: 'Öffne die Europeana-Entwicklerseite', pt: 'Abra a página de programadores da Europeana', gl: 'Abre a páxina de desenvolvedores de Europeana', ca: 'Obre la pàgina de desenvolupadors d’Europeana', eu: 'Ireki Europeana garatzaileen orria' } },
      { text: { en: 'Request a key and complete the form', es: 'Solicita una clave y completa el formulario', fr: 'Demandez une clé et remplissez le formulaire', de: 'Fordere einen Schlüssel an und fülle das Formular aus', pt: 'Peça uma chave e preencha o formulário', gl: 'Solicita unha clave e completa o formulario', ca: 'Demana una clau i omple el formulari', eu: 'Eskatu gako bat eta bete formularioa' } },
      { text: { en: 'Paste the key into the field above', es: 'Pega la clave en el campo superior', fr: 'Collez la clé dans le champ ci-dessus', de: 'Füge den Schlüssel oben ein', pt: 'Cole a chave no campo acima', gl: 'Pega a clave no campo superior', ca: 'Enganxa la clau al camp superior', eu: 'Itsatsi gakoa goiko eremuan' } },
    ],
  },
  prado: {
    title: { en: 'How to access Museo del Prado search', es: 'Cómo acceder a la búsqueda del Museo del Prado', fr: 'Comment accéder à la recherche du Museo del Prado', de: 'So greifst du auf die Suche des Museo del Prado zu', pt: 'Como aceder à pesquisa do Museo del Prado', gl: 'Como acceder á busca do Museo del Prado', ca: 'Com accedir a la cerca del Museo del Prado', eu: 'Nola sartu Museo del Prado bilaketan' },
    note: { en: 'This provider uses a Europeana key behind the scenes.', es: 'Este proveedor usa internamente una clave de Europeana.', fr: 'Ce fournisseur utilise une clé Europeana en interne.', de: 'Dieser Anbieter nutzt intern einen Europeana-Schlüssel.', pt: 'Este fornecedor usa internamente uma chave da Europeana.', gl: 'Este provedor usa internamente unha clave de Europeana.', ca: 'Aquest proveïdor utilitza internament una clau d’Europeana.', eu: 'Hornitzaile honek Europeana gako bat erabiltzen du barrutik.' },
    steps: [
      { url: 'https://pro.europeana.eu/page/get-api', text: { en: 'Request a Europeana key', es: 'Solicita una clave de Europeana', fr: 'Demandez une clé Europeana', de: 'Fordere einen Europeana-Schlüssel an', pt: 'Peça uma chave da Europeana', gl: 'Solicita unha clave de Europeana', ca: 'Demana una clau d’Europeana', eu: 'Eskatu Europeana gako bat' } },
      { text: { en: 'Use that key in the field above', es: 'Usa esa clave en el campo superior', fr: 'Utilisez cette clé dans le champ ci-dessus', de: 'Nutze diesen Schlüssel im Feld oben', pt: 'Use essa chave no campo acima', gl: 'Usa esa clave no campo superior', ca: 'Fes servir aquesta clau al camp superior', eu: 'Erabili gako hori goiko eremuan' } },
    ],
  },
  pexels: {
    title: { en: 'How to get a Pexels API key', es: 'Cómo obtener la API key de Pexels', fr: 'Comment obtenir une clé API Pexels', de: 'So bekommst du einen Pexels-API-Schlüssel', pt: 'Como obter uma chave API da Pexels', gl: 'Como obter unha API key de Pexels', ca: 'Com obtenir una clau API de Pexels', eu: 'Nola lortu Pexels API gakoa' },
    steps: [
      { url: 'https://www.pexels.com/api/', text: { en: 'Open the Pexels API page and sign in', es: 'Abre la página de la API de Pexels e inicia sesión', fr: 'Ouvrez la page API de Pexels et connectez-vous', de: 'Öffne die Pexels-API-Seite und melde dich an', pt: 'Abra a página da API da Pexels e inicie sessão', gl: 'Abre a páxina da API de Pexels e inicia sesión', ca: 'Obre la pàgina de l’API de Pexels i inicia sessió', eu: 'Ireki Pexels API orria eta hasi saioa' } },
      { text: { en: 'Generate your key and paste it above', es: 'Genera tu clave y pégala arriba', fr: 'Générez votre clé et collez-la ci-dessus', de: 'Erzeuge deinen Schlüssel und füge ihn oben ein', pt: 'Gere a sua chave e cole-a acima', gl: 'Xera a túa clave e pégaa enriba', ca: 'Genera la clau i enganxa-la a dalt', eu: 'Sortu zure gakoa eta itsatsi goian' } },
    ],
  },
  pixabay: {
    title: { en: 'How to get a Pixabay API key', es: 'Cómo obtener la API key de Pixabay', fr: 'Comment obtenir une clé API Pixabay', de: 'So bekommst du einen Pixabay-API-Schlüssel', pt: 'Como obter uma chave API do Pixabay', gl: 'Como obter unha API key de Pixabay', ca: 'Com obtenir una clau API de Pixabay', eu: 'Nola lortu Pixabay API gakoa' },
    steps: [
      { url: 'https://pixabay.com/api/docs/', text: { en: 'Open the Pixabay API documentation while signed in', es: 'Abre la documentación de Pixabay con sesión iniciada', fr: 'Ouvrez la documentation Pixabay en étant connecté', de: 'Öffne die Pixabay-Dokumentation, während du angemeldet bist', pt: 'Abra a documentação do Pixabay com sessão iniciada', gl: 'Abre a documentación de Pixabay coa sesión iniciada', ca: 'Obre la documentació de Pixabay amb sessió iniciada', eu: 'Ireki Pixabay dokumentazioa saioa hasita' } },
      { text: { en: 'Copy the key shown on the page', es: 'Copia la clave que aparece en la página', fr: 'Copiez la clé affichée sur la page', de: 'Kopiere den Schlüssel von der Seite', pt: 'Copie a chave mostrada na página', gl: 'Copia a clave que aparece na páxina', ca: 'Copia la clau que apareix a la pàgina', eu: 'Kopiatu orrian agertzen den gakoa' } },
    ],
  },
  unsplash: {
    title: { en: 'How to get an Unsplash access key', es: 'Cómo obtener la Access Key de Unsplash', fr: 'Comment obtenir une clé d’accès Unsplash', de: 'So bekommst du einen Unsplash-Zugangsschlüssel', pt: 'Como obter uma access key da Unsplash', gl: 'Como obter a Access Key de Unsplash', ca: 'Com obtenir l’Access Key d’Unsplash', eu: 'Nola lortu Unsplash access key-a' },
    steps: [
      { url: 'https://unsplash.com/developers', text: { en: 'Open the Unsplash developers portal', es: 'Abre el portal de desarrolladores de Unsplash', fr: 'Ouvrez le portail développeur d’Unsplash', de: 'Öffne das Unsplash-Entwicklerportal', pt: 'Abra o portal de programadores da Unsplash', gl: 'Abre o portal de desenvolvedores de Unsplash', ca: 'Obre el portal de desenvolupadors d’Unsplash', eu: 'Ireki Unsplash garatzaileen ataria' } },
      { text: { en: 'Create an application and copy the Access Key', es: 'Crea una aplicación y copia la Access Key', fr: 'Créez une application et copiez la clé d’accès', de: 'Erstelle eine Anwendung und kopiere den Access Key', pt: 'Crie uma aplicação e copie a Access Key', gl: 'Crea unha aplicación e copia a Access Key', ca: 'Crea una aplicació i copia l’Access Key', eu: 'Sortu aplikazio bat eta kopiatu Access Key-a' } },
    ],
  },
  google: {
    title: { en: 'How to configure Google Images', es: 'Cómo configurar Google Images', fr: 'Comment configurer Google Images', de: 'So konfigurierst du Google Images', pt: 'Como configurar o Google Images', gl: 'Como configurar Google Images', ca: 'Com configurar Google Images', eu: 'Nola konfiguratu Google Images' },
    note: { en: 'You need both an API key and a CX identifier.', es: 'Necesitas una API key y un identificador CX.', fr: 'Vous avez besoin d’une clé API et d’un identifiant CX.', de: 'Du brauchst sowohl einen API-Schlüssel als auch eine CX-ID.', pt: 'Precisa de uma API key e de um identificador CX.', gl: 'Necesitas unha API key e un identificador CX.', ca: 'Necessites una clau API i un identificador CX.', eu: 'API gako bat eta CX identifikatzaile bat behar dituzu.' },
    steps: [
      { url: 'https://console.cloud.google.com/', text: { en: 'Create a project in Google Cloud', es: 'Crea un proyecto en Google Cloud', fr: 'Créez un projet dans Google Cloud', de: 'Erstelle ein Projekt in Google Cloud', pt: 'Crie um projeto no Google Cloud', gl: 'Crea un proxecto en Google Cloud', ca: 'Crea un projecte a Google Cloud', eu: 'Sortu proiektu bat Google Cloud-en' } },
      { url: 'https://console.cloud.google.com/apis/library/customsearch.googleapis.com', text: { en: 'Enable the Custom Search JSON API', es: 'Activa la Custom Search JSON API', fr: 'Activez l’API Custom Search JSON', de: 'Aktiviere die Custom Search JSON API', pt: 'Ative a Custom Search JSON API', gl: 'Activa a Custom Search JSON API', ca: 'Activa la Custom Search JSON API', eu: 'Gaitu Custom Search JSON API-a' } },
      { url: 'https://programmablesearchengine.google.com/controlpanel/create', text: { en: 'Create a programmable search engine and copy the CX ID', es: 'Crea un motor programable y copia el CX', fr: 'Créez un moteur programmable et copiez le CX', de: 'Erstelle eine programmierbare Suchmaschine und kopiere die CX-ID', pt: 'Crie um motor programável e copie o CX', gl: 'Crea un motor programable e copia o CX', ca: 'Crea un motor programable i copia el CX', eu: 'Sortu bilatzaile programagarri bat eta kopiatu CX-a' } },
    ],
  },
}

export function getLocalizedLabel(entry, language) {
  return localized(entry.label, language)
}

export function getLocalizedHint(entry, language) {
  return localized(entry.hint ?? {}, language)
}

export function getLocalizedGuide(guide, language) {
  if (!guide) return null

  return {
    title: localized(guide.title, language),
    note: guide.note ? localized(guide.note, language) : '',
    modelUrl: guide.modelUrl,
    modelLabel: guide.modelLabel ? localized(guide.modelLabel, language) : '',
    steps: guide.steps.map((step) => ({
      url: step.url,
      text: localized(step.text, language),
    })),
  }
}

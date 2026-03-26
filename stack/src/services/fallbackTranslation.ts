// Fallback translation service for testing when Google Cloud API is unavailable
const FALLBACK_TRANSLATIONS: Record<string, Record<string, string>> = {
  es: {
    "Hello": "Hola",
    "Welcome": "Bienvenido",
    "Thank you": "Gracias",
    "Goodbye": "Adiós",
    "Please": "Por favor",
    "Sorry": "Lo siento",
    "Yes": "Sí",
    "No": "No",
    "Help": "Ayuda",
    "Settings": "Configuración",
    "Language": "Idioma",
    "Translate": "Traducir",
    "Cancel": "Cancelar",
    "Save": "Guardar",
    "Delete": "Eliminar",
    "Edit": "Editar",
    "Close": "Cerrar",
    "Open": "Abrir",
    "Search": "Buscar",
    "Filter": "Filtrar",
    "Sort": "Ordenar",
    "Loading": "Cargando",
    "Error": "Error",
    "Success": "Éxito",
    "Warning": "Advertencia",
    "Information": "Información"
  },
  hi: {
    "Hello": "नमस्ते",
    "Welcome": "स्वागत",
    "Thank you": "धन्यवाद",
    "Goodbye": "अलविदा",
    "Please": "कृपया",
    "Sorry": "क्षमा करें",
    "Yes": "हाँ",
    "No": "नहीं",
    "Help": "मदद",
    "Settings": "सेटिंग्स",
    "Language": "भाषा",
    "Translate": "अनुवाद करें",
    "Cancel": "रद्द करें",
    "Save": "सहेजें",
    "Delete": "हटाएं",
    "Edit": "संपादित करें",
    "Close": "बंद करें",
    "Open": "खोलें",
    "Search": "खोजें",
    "Filter": "फ़िल्टर करें",
    "Sort": "छाँटें",
    "Loading": "लोड हो रहा है",
    "Error": "त्रुटि",
    "Success": "सफलता",
    "Warning": "चेतावनी",
    "Information": "जानकारी"
  },
  pt: {
    "Hello": "Olá",
    "Welcome": "Bem-vindo",
    "Thank you": "Obrigado",
    "Goodbye": "Tchau",
    "Please": "Por favor",
    "Sorry": "Desculpe",
    "Yes": "Sim",
    "No": "Não",
    "Help": "Ajuda",
    "Settings": "Configurações",
    "Language": "Idioma",
    "Translate": "Traduzir",
    "Cancel": "Cancelar",
    "Save": "Salvar",
    "Delete": "Excluir",
    "Edit": "Editar",
    "Close": "Fechar",
    "Open": "Abrir",
    "Search": "Pesquisar",
    "Filter": "Filtrar",
    "Sort": "Classificar",
    "Loading": "Carregando",
    "Error": "Erro",
    "Success": "Sucesso",
    "Warning": "Aviso",
    "Information": "Informação"
  },
  zh: {
    "Hello": "你好",
    "Welcome": "欢迎",
    "Thank you": "谢谢",
    "Goodbye": "再见",
    "Please": "请",
    "Sorry": "对不起",
    "Yes": "是",
    "No": "不",
    "Help": "帮助",
    "Settings": "设置",
    "Language": "语言",
    "Translate": "翻译",
    "Cancel": "取消",
    "Save": "保存",
    "Delete": "删除",
    "Edit": "编辑",
    "Close": "关闭",
    "Open": "打开",
    "Search": "搜索",
    "Filter": "筛选",
    "Sort": "排序",
    "Loading": "加载中",
    "Error": "错误",
    "Success": "成功",
    "Warning": "警告",
    "Information": "信息"
  },
  fr: {
    "Hello": "Bonjour",
    "Welcome": "Bienvenue",
    "Thank you": "Merci",
    "Goodbye": "Au revoir",
    "Please": "S'il vous plaît",
    "Sorry": "Désolé",
    "Yes": "Oui",
    "No": "Non",
    "Help": "Aide",
    "Settings": "Paramètres",
    "Language": "Langue",
    "Translate": "Traduire",
    "Cancel": "Annuler",
    "Save": "Enregistrer",
    "Delete": "Supprimer",
    "Edit": "Modifier",
    "Close": "Fermer",
    "Open": "Ouvrir",
    "Search": "Rechercher",
    "Filter": "Filtrer",
    "Sort": "Trier",
    "Loading": "Chargement",
    "Error": "Erreur",
    "Success": "Succès",
    "Warning": "Avertissement",
    "Information": "Information"
  }
};

export const fallbackTranslate = (text: string, targetLanguage: string): string => {
  // Try exact match first
  const translations = FALLBACK_TRANSLATIONS[targetLanguage];
  if (translations && translations[text]) {
    return translations[text];
  }

  // Try case-insensitive match
  if (translations) {
    const lowerText = text.toLowerCase();
    for (const [english, translation] of Object.entries(translations)) {
      if (english.toLowerCase() === lowerText) {
        return translation;
      }
    }
  }

  // Return original text if no translation found
  return text;
};

export const hasFallbackTranslation = (text: string, targetLanguage: string): boolean => {
  const translations = FALLBACK_TRANSLATIONS[targetLanguage];
  if (!translations) return false;
  
  return translations[text] !== undefined || 
    Object.keys(translations).some(key => key.toLowerCase() === text.toLowerCase());
};

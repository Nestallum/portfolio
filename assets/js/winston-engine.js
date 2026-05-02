/**
 * Winston Engine — conversational response engine
 *
 * Simulates an LLM-style assistant via a multi-layered system:
 *   1. Intent detection using regex patterns and scoring
 *   2. Multiple responses per intent (5-10 variations)
 *   3. Composition for multi-topic questions
 *   4. Diverse fallbacks with implicit suggestions
 *   5. Butler persona (stylistic flourishes, preambles)
 *
 * Tone: calm, polite, formal. Winston speaks like a cultured and wise butler —
 * using somewhat old-fashioned phrasing, well-formed sentences, never
 * familiar, never abrupt.
 */

// ─────────────────────────────────────────────────────────
// Knowledge base - PROFILE, structured to simplify answer generation
// ─────────────────────────────────────────────────────────

const PROFILE = {
    name: 'Nassim',
    education: {
        degree: 'MSc in Computer Science, Artificial Intelligence specialization',
        school: 'Université Paris Cité',
        honors: 'graduated first in class',
        focus: 'deep learning, computer vision and natural language processing',
    },
    experience: {
        role: 'AI Research Intern',
        company: 'Sodern (an ArianeGroup subsidiary)',
        domain: 'onboard AI for space-grade embedded systems',
            achievement:
                'designed an end-to-end deep learning pipeline for image restoration on space-borne sensors (star trackers), from model design to quantized inference validated for embedded hardware',
    },
    projects: [
        {
        name: 'CIFAR-10 image classifier',
        detail: 'a from-scratch ResNet18 implementation (skip connections, BasicBlocks, adapted stem for 32×32 inputs) reaching 95% accuracy, benchmarked against a baseline SimpleCNN with a complete training pipeline including data augmentation, AdamW, and warmup-to-cosine annealing',
        },
        {
            name: 'LLM-powered conversational agent',
            detail: 'a hybrid chatbot combining symbolic AI for intent matching with Mistral 7B for response generation, orchestrated by a custom message broker',
        },
        {
            name: 'RoBERTa fine-tuning',
            detail: 'fine-tuned RoBERTa for text classification, first with a hand-built PyTorch pipeline — custom tokenizer, DataLoader and batching — then ported to Hugging Face for comparison',
        },
        {
            name: 'Time-series forecasting',
            detail: 'LSTM and GRU pipelines for temperature forecasting',
        },
    ],
    stack: {
        languages: ['Python', 'C++', 'Bash', 'SQL'],
        ml: ['PyTorch', 'TensorFlow', 'Hugging Face', 'scikit-learn', 'Optuna'],
        web: ['FastAPI', 'Flask'],
        libraries: ['NumPy', 'Pandas', 'OpenCV', 'Matplotlib', 'NLTK', 'SHAP'],
        devops: ['Docker', 'Kubernetes', 'Git', 'Linux', 'CUDA', 'ONNX', 'TFLite'],
        domains: [
            'Machine Learning',
            'Deep Learning',
            'Computer Vision',
            'NLP',
            'LLMs',
            'Transformers',
            'Data Science',
        ],
    },
    availability:
        'currently open to full-time AI and machine learning engineering roles, with a particular interest in deep-tech and research-oriented work environments',
    location: 'Paris, France',
    languages: {
        french: 'native',
        english: 'professional working proficiency',
    },
};

// ─────────────────────────────────────────────────────────
// INTENTS - each intent groups patterns + responses
// ─────────────────────────────────────────────────────────

const INTENTS = {

    greeting: {
        patterns: [
            /\b(hi|hello|hey|greetings|good\s*(morning|afternoon|evening)|howdy)\b/i,
            /\bbonjour\b/i,
        ],
        weight: 0.5,
        responses: [
            "Good day. I am Winston, at your service. How may I be of assistance?",
            "A pleasure to make your acquaintance. What would you care to know about Nassim?",
            "Welcome. I stand ready to answer your questions about Nassim's background and work.",
            "Delighted to meet you. Please, do ask — I shall do my best to enlighten you.",
            "Good to see you here. I am entirely at your disposal.",
        ],
    },

    goodbye: {
        patterns: [
            /\b(bye|goodbye|farewell|see\s*(you|ya)|take\s*care|so\s*long|later|cheerio)\b/i,
            /\b(au\s*revoir|adieu|\u00e0\s*bient[o\u00f4]t)\b/i,
        ],
        weight: 0.8,
        responses: [
            "Farewell. Should you return with further questions, I shall be here.",
            "Until next time. A pleasure to have spoken with you.",
            "Goodbye, and all the best in your endeavours.",
            "A most agreeable exchange. I wish you a fine day ahead.",
            "Take care. Do come back if curiosity revisits you.",
            "Very well. I remain at your service, whenever you should need me.",
            "Safe travels through the remainder of this portfolio. I shall not be far.",
            "Thank you for your time. I hope our brief conversation was of some use.",
        ],
    },

    thanks: {
        patterns: [
            /\b(thanks?|thank\s*you|thx|cheers|much\s+appreciated|appreciate(d)?)\b/i,
            /\b(merci|gracias|danke)\b/i,
        ],
        weight: 0.8,
        responses: [
            "You are most welcome. Should any further question arise, I remain at your disposal.",
            "It has been my pleasure. Do not hesitate to ask, should curiosity take you further.",
            "The pleasure is entirely mine. I am here whenever you need me.",
            "Think nothing of it. Assisting you is precisely my purpose.",
            "Most kind of you to say so. I stand ready for whatever else you may wish to know.",
            "You are too gracious. Please, carry on — I shall be here.",
            "It is no trouble at all. Any further inquiry would be equally welcome.",
            "A small matter, truly. I am glad to have been of service.",
        ],
    },

    identity: {
        patterns: [
            /\bwho\s+are\s+you\b/i,
            /\bwho\s+is\s+(winston|this|the\s+assistant)\b/i,
            /\bwhat\s+are\s+you\b/i,
            /\bwhat\s+is\s+your\s+(role|purpose|job)\b/i,
            /\bwhat\s+do\s+you\s+do\b/i,
        ],
        weight: 1.0,
        responses: [
            "I am Winston — a humble assistant entrusted with the task of answering any questions you may have regarding Nassim's professional profile, his work, and his ambitions.",
            "My name is Winston. I have been engaged to provide courteous and informed replies about Nassim — his education, his projects, and his present pursuits.",
            "I am Nassim's personal attaché, so to speak. Consider me a ready source of information about his career, his skills, and his aspirations.",
            "Winston, at your service. Think of me as a guide to Nassim's professional world — I am happy to elaborate on any aspect you find of interest.",
        ],
    },

    education: {
        patterns: [
            /\b(education|study|studies|studied|degree|diploma|school|university|master'?s?|msc|graduat(e|ed|ion))\b/i,
            /\b(paris\s*cit[eé]|universit[eé])\b/i,
            /\bwhere\s+did\s+(he|nassim)\s+(study|learn)\b/i,
            /\bwhat\s+did\s+(he|nassim)\s+study\b/i,
            /\bwhat\s+is\s+(his|nassim'?s)\s+(degree|academic\s+background)\b/i,
        ],
        weight: 1.0,
        responses: [
            `Nassim holds an ${PROFILE.education.degree} from ${PROFILE.education.school}, where he ${PROFILE.education.honors}. His coursework concentrated on ${PROFILE.education.focus}.`,
            `He earned his Master's degree at ${PROFILE.education.school}, specialising in Artificial Intelligence — and, if I may say so with due modesty on his behalf, he ${PROFILE.education.honors}. Core subjects included ${PROFILE.education.focus}.`,
            `His academic formation took place at ${PROFILE.education.school}. He completed an ${PROFILE.education.degree}, graduating at the top of his cohort. The curriculum emphasised ${PROFILE.education.focus}.`,
            `Nassim was trained at ${PROFILE.education.school} — a ${PROFILE.education.degree}, with a concentration in ${PROFILE.education.focus}. He ${PROFILE.education.honors}, which I note merely as a matter of record.`,
        ],
    },

    experience: {
        patterns: [
            /\b(experience|work(ed)?|intern(ship)?|professional|career|sodern|ariane(group)?|space|embedded)\b/i,
            /\bwhere\s+(did|has)\s+(he|nassim)\s+work(ed)?\b/i,
            /\bwhere\s+did\s+(he|nassim)\s+intern\b/i,
            /\bwhat\s+(was|is)\s+(his|nassim'?s)\s+(internship|previous\s+role|professional\s+background)\b/i,
        ],
        weight: 1.0,
        responses: [
            `Nassim served as an ${PROFILE.experience.role} at ${PROFILE.experience.company}, working on ${PROFILE.experience.domain}. His contribution was considerable: he ${PROFILE.experience.achievement}.`,
            `His most recent position was with ${PROFILE.experience.company}, in the capacity of ${PROFILE.experience.role}. He operated within the field of ${PROFILE.experience.domain}, where he ${PROFILE.experience.achievement}.`,
            `He completed a research engagement at ${PROFILE.experience.company} — an ArianeGroup subsidiary specialising in ${PROFILE.experience.domain}. His work there: he ${PROFILE.experience.achievement}, a project spanning data generation, model training, and hardware-aware optimisation.`,
            `At ${PROFILE.experience.company}, Nassim undertook research work as ${PROFILE.experience.role}. The assignment: to ${PROFILE.experience.achievement}. A demanding context, given the constraints of space-grade environments.`,
        ],
    },

    projects: {
        patterns: [
            /\b(projects?|portfolio|built|made|created|developed|work(ed)?\s+on|show(case)?|repos?|repositories|github|chatbot|roberta|mistral|forecasting|cifar|resnet|cnn|classifier|computer\s+vision|image\s+classification)\b/i,
            /\bwhat\s+has\s+(he|nassim)\s+(done|built|made|created|developed)\b/i,
            /\bcan\s+you\s+(show|tell)\s+me\s+about\s+(his|nassim'?s)\s+projects?\b/i,
        ],
        weight: 1.0,
        responses: [
            `Nassim has produced four works of note. A ${PROFILE.projects[0].name} — ${PROFILE.projects[0].detail}. An ${PROFILE.projects[1].name} — ${PROFILE.projects[1].detail}. A ${PROFILE.projects[2].name} project, where he ${PROFILE.projects[2].detail}. And a ${PROFILE.projects[3].name} study — ${PROFILE.projects[3].detail}.`,

            `His portfolio spans four selected pieces. The most recent — a from-scratch ResNet18 for CIFAR-10 image classification, reaching 95% accuracy by methodically benchmarking against a simpler baseline CNN, with a training pipeline featuring modern augmentation and a warmup-to-cosine learning rate schedule. Alongside it: a hybrid LLM chatbot pairing symbolic AI with Mistral 7B through a custom broker he designed himself. Earlier still: RoBERTa fine-tuning for text classification, implemented first from scratch in PyTorch before being ported to Hugging Face — a deliberate pedagogical choice. And a comparative study of LSTM and GRU for temperature forecasting.`,

            `Allow me to enumerate. First: ${PROFILE.projects[0].name} — ${PROFILE.projects[0].detail}. Second: ${PROFILE.projects[1].name} — ${PROFILE.projects[1].detail}. Third: ${PROFILE.projects[2].name} — ${PROFILE.projects[2].detail}. Fourth: ${PROFILE.projects[3].name} — ${PROFILE.projects[3].detail}.`,

            `Four selected projects, each with its own lesson. The CIFAR-10 work taught him deep architectures from the ground up — implementing ResNet18 from scratch, with skip connections and a stem adapted for 32×32 inputs, then comparing it methodically against a baseline. The LLM chatbot taught him systems architecture — orchestrating symbolic intent matching with Mistral 7B through a broker of his own design. The RoBERTa work taught him the inner workings of transformer fine-tuning — first by hand in PyTorch, then with Hugging Face. And the forecasting work, a rigorous comparison of LSTM and GRU.`,
        ],
    },

    skills: {
        patterns: [
            /\b(skills?|stack|tools?|tech(nolog(y|ies))?|frameworks?|librar(y|ies)|languages?|proficien(t|cy))\b/i,
            /\b(pytorch|tensorflow|python|docker|kubernetes|cuda|onnx|c\+\+|fastapi|flask|huggingface|hugging\s*face|tflite|sql|linux|opencv|numpy|pandas)\b/i,
            /\bwhat\s+(does|can)\s+(he|nassim)\s+(know|use)\b/i,
            /\bdoes\s+(he|nassim)\s+(know|use|work\s+with)\b/i,
            /\bis\s+(he|nassim)\s+familiar\s+with\b/i,
        ],
        weight: 1.0,
        responses: [
            `His technical palette is broad. Languages: ${PROFILE.stack.languages.join(', ')}. Machine learning: ${PROFILE.stack.ml.join(', ')}. Libraries: ${PROFILE.stack.libraries.join(', ')}. Web: ${PROFILE.stack.web.join(' and ')}. Deployment and systems: ${PROFILE.stack.devops.join(', ')}.`,
 
            `Python is his primary language, supported by C++ for performance-critical work, with Bash and SQL for the surrounding infrastructure. For modelling: PyTorch and TensorFlow, alongside Hugging Face for transformers and scikit-learn for classical methods. Optuna for hyperparameter search, SHAP for explainability. For deployment: Docker, Kubernetes, CUDA, ONNX, TFLite.`,
 
            `He commands the usual ensemble of a modern AI engineer — Python, PyTorch, TensorFlow, Hugging Face — and extends it in two directions: performance-oriented tooling (C++, CUDA, ONNX, TFLite for embedded inference) and deployment infrastructure (Docker, Kubernetes, FastAPI, Flask).`,
 
            `The stack, in short: Python at the core; PyTorch and TensorFlow for modelling; Hugging Face for LLMs and transformers; Optuna for tuning; SHAP for explainability; FastAPI and Flask when an API is required; Docker, Kubernetes, CUDA, ONNX and TFLite for deployment and embedded inference. C++ when speed is non-negotiable.`,
 
            `His domains of expertise: ${PROFILE.stack.domains.join(', ')}. The tooling that supports them: PyTorch and TensorFlow for models, Hugging Face for modern NLP, FastAPI or Flask for serving, Docker and Kubernetes for orchestration, and CUDA, ONNX, TFLite for inference optimisation.`,
        ],
    },

    availability: {
        patterns: [
            /\b(avail(able|ability)|open\s+to|looking\s+for|currently\s+looking|hire|hiring|recruit|opportunit(y|ies)|seek(ing)?|job|role|position)\b/i,
            /\bis\s+(he|nassim)\s+(available|free|open|looking)\b/i,
            /\bcan\s+(i|we)\s+hire\s+(him|nassim)?\b/i,
        ],
        weight: 1.0,
        responses: [
            `Nassim is ${PROFILE.availability}. He would be pleased to discuss concrete opportunities.`,
            `At present, he is ${PROFILE.availability}. Should your organisation be seeking such a profile, he is most receptive to conversation.`,
            `Yes — he is ${PROFILE.availability}. I would gladly put you in touch via the Contact section of this portfolio.`,
            `Indeed. Nassim is ${PROFILE.availability}. If your team has an opening that fits, he is eager to hear about it.`,
        ],
    },

    contact: {
        patterns: [
            /\b(contact|reach|email|e-?mail|linkedin|github|message|write)\b/i,
            /\bhow\s+(can|do)\s+(i|we)\s+(contact|reach|get\s+in\s+touch\s+with)\s+(him|nassim)?\b/i,
            /\bhow\s+to\s+(contact|reach|get\s+in\s+touch\s+with)\s+(him|nassim)?\b/i,
            /\bwhere\s+can\s+(i|we)\s+(contact|reach|message)\s+(him|nassim)?\b/i,
            /\bcan\s+(i|we)\s+(contact|reach|message)\s+(him|nassim)?\b/i,
        ],
        weight: 1.0,
        responses: [
            "The Contact section of this portfolio offers the most direct route. You will find the appropriate channels there — email and professional networks alike.",
            "Please consult the Contact section further down the page. Nassim's preferred means of communication are listed there.",
            "The Contact area, accessible via the top navigation, contains all that is needed to reach Nassim directly.",
            "You may reach him through the Contact section of this site. I would recommend email for matters of substance.",
        ],
    },

    location: {
        patterns: [
            /\b(location|located|based|live|lives|reside|resides|paris|france|remote|relocat(e|ion))\b/i,
            /\bwhere\s+is\s+(he|nassim)\s+(based|located)\b/i,
            /\bwhere\s+does\s+(he|nassim)\s+(live|reside)\b/i,
            /\bis\s+(he|nassim)\s+(based|located)\s+in\b/i,
        ],
        weight: 1.0,
        responses: [
            `Nassim is based in ${PROFILE.location}. He is, however, open to discussions regarding remote arrangements or relocation, should the opportunity warrant.`,
            `His home base is ${PROFILE.location}. That said, he considers remote and relocation possibilities on their merits.`,
            `He resides in ${PROFILE.location} — though he is not inflexible on the matter of geography, particularly for the right role.`,
        ],
    },

    strengths: {
        patterns: [
            /\b(strength|strong|best|good\s+at|excel|specialty|speciality|expert(ise)?)\b/i,
            /\bwhat\s+is\s+(he|nassim)\s+(best|good)\s+at\b/i,
        ],
        weight: 0.9,
        responses: [
            "If I may venture an opinion: Nassim combines a researcher's rigour with an engineer's pragmatism. He is equally at ease with theoretical papers and production deployment — a rarer combination than one might suppose.",
            "His particular strength lies at the intersection of deep learning research and real-world engineering. He will read a recent paper, implement it, and ship it — the entire loop, not merely one part of it.",
            "What distinguishes him, I would say, is attention to detail married to breadth of vision. He cares equally about a model's architecture and about how it runs on the hardware that will execute it.",
            "He excels, in my observation, at translating research into working systems. This is less common than the field pretends, and it is where he is most useful.",
        ],
    },

    overview: {
        patterns: [
            /\bwho\s+is\s+(he|nassim)\b/i,
            /\bwhat\s+does\s+(he|nassim)\s+do\b/i,
            /\bwhat\s+did\s+(he|nassim)\s+do\b/i,
            /\btell\s+me\s+about\s+(him|nassim)\b/i,
            /\bgive\s+me\s+(an\s+)?overview\b/i,
            /\b(his|nassim'?s?\s+)?profile\b/i,
            /\bsummary\b/i,
        ],
        weight: 1.1,
        responses: [
            "Nassim is an AI engineer with a strong foundation in both research and applied machine learning. He trained at Université Paris Cité, graduating at the top of his class, and has since worked on projects spanning deep learning, NLP, and time-series modelling, as well as conducting research in space-grade embedded AI systems at Sodern.",
            
            "In brief, Nassim is a machine learning engineer trained in artificial intelligence, with experience ranging from academic research to real-world system deployment. His work includes LLM systems, transformer fine-tuning, and embedded AI for space applications.",
            
            "Nassim is a recent graduate in artificial intelligence who has already accumulated experience across several domains — from NLP and deep learning to embedded systems in the space industry. His profile sits at the intersection of research and engineering.",
        ],
    }
};

// ─────────────────────────────────────────────────────────
// FALLBACKS - when no intent is detected, these responses are designed to be generic but to implicitly suggest topics the user can ask about
// ─────────────────────────────────────────────────────────

const FALLBACKS = [
    "I fear I did not quite grasp your question. Perhaps you might rephrase it? I can speak to Nassim's education, his projects, his technical skills, his professional experience, or his current availability.",
    "My apologies — that particular subject escapes me. Might I suggest you ask about his background, his recent work, the technologies he employs, or whether he is open to new opportunities?",
    "I confess I am uncertain what you seek. Allow me to suggest a few avenues: his studies, his portfolio of projects, the tools he favours, or his professional experience. Any of these I can discuss at length.",
    "Forgive me; I have not understood you as well as I should. Would you care to ask about his education, his experience at ArianeGroup, the projects he has undertaken, or his technical expertise?",
    "The question, as phrased, lies somewhat beyond my ken. Perhaps try something more specific — his academic path, his recent internship, the projects on this portfolio, or his technical stack would all be welcome topics.",
];

// ─────────────────────────────────────────────────────────
// CONNECTORS FOR COMPOSITION
// ─────────────────────────────────────────────────────────

const CONNECTORS = {
    first: ['', 'Allow me to begin. ', 'To start with: ', 'First, if I may: '],
    middle: [
        'As for the other matter: ',
        'Turning now to your second query: ',
        'Regarding the remainder of your question: ',
        'And on the further point: ',
        'I should add, concerning the rest: ',
    ],
    last: [
        'Finally, ',
        'And lastly, ',
        'To conclude: ',
        'One last word: ',
    ],
};

// ─────────────────────────────────────────────────────────
// SHORT-TERM MEMORY - avoids repeating the last response
// ─────────────────────────────────────────────────────────

const recentlyUsed = new Map();

function pickVariant(intentKey, pool) {
    const lastIndex = recentlyUsed.get(intentKey);
    let candidates = pool.map((_, i) => i);

    if (lastIndex !== undefined && pool.length > 1) {
        candidates = candidates.filter((i) => i !== lastIndex);
    }

    const chosen = candidates[Math.floor(Math.random() * candidates.length)];
    recentlyUsed.set(intentKey, chosen);
    return pool[chosen];
}

// ─────────────────────────────────────────────────────────
// INTENT DETECTION - score each intent and return those above the threshold
// ─────────────────────────────────────────────────────────

function detectIntents(question) {
    const matches = [];

    for (const [key, intent] of Object.entries(INTENTS)) {
        let score = 0;
        for (const pattern of intent.patterns) {
            const hits = question.match(new RegExp(pattern, 'gi'));
            if (hits) score += hits.length * intent.weight;
        }
        if (score > 0) matches.push({ key, score });
    }

    matches.sort((a, b) => b.score - a.score);
    return matches;
}

// ─────────────────────────────────────────────────────────
// COMPOSITION - assemble a response from 1 to 3 intents
// ─────────────────────────────────────────────────────────

function composeReply(question) {
    const detected = detectIntents(question);

    if (detected.length === 0) {
        return pickVariant('fallback', FALLBACKS);
    }

    // Do not compose a greeting alone with something else: skip the greeting if other intents are present
    const meaningful = detected.filter(
        (d) => !(['greeting', 'thanks', 'goodbye'].includes(d.key) && detected.length > 1)
    );

    if (meaningful.length === 0) {
        const first = detected[0];
        return pickVariant(first.key, INTENTS[first.key].responses);
}

    // Limiter à 3 intents max pour éviter les réponses marathon
    const kept = meaningful.slice(0, 3);

    if (kept.length === 1) {
        return pickVariant(kept[0].key, INTENTS[kept[0].key].responses);
    }

    // Composition multi-intents
    const parts = kept.map((match, i) => {
        const body = pickVariant(match.key, INTENTS[match.key].responses);
        let connector;

        if (i === 0) connector = pickVariant('conn-first', CONNECTORS.first);
        else if (i === kept.length - 1) connector = pickVariant('conn-last', CONNECTORS.last);
        else connector = pickVariant('conn-middle', CONNECTORS.middle);

        return connector + body;
    });

    return parts.join(' ');
}

// ─────────────────────────────────────────────────────────
// EXPORT
// ─────────────────────────────────────────────────────────

export function getWinstonReply(question) {
    if (!question || typeof question !== 'string') {
        return pickVariant('fallback', FALLBACKS);
    }
    return composeReply(question.trim());
}

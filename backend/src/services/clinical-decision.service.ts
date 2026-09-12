import { prisma } from '../lib/prisma.js';
import { HttpError } from '../lib/errors.js';

export interface TreatmentPhase {
  phaseNumber: number;
  title: string;
  titleAr: string;
  weeks: string;
  goals: string[];
  goalsAr: string[];
  modalities: string[];
  modalitiesAr: string[];
  precautions: string[];
  precautionsAr: string[];
  recommendedExercises: string[];
}

export interface CreateProtocolDto {
  title: string;
  titleAr: string;
  diagnosisCode?: string;
  bodyRegion: string;
  category: string;
  description: string;
  descriptionAr: string;
  phases: TreatmentPhase[];
  expectedDurationWeeks?: number;
  evidenceSource: string;
  precautions: string[];
  successRatePct?: number;
}

const DEFAULT_PROTOCOLS: CreateProtocolDto[] = [
  {
    title: 'ACL Reconstruction Rehabilitation Protocol',
    titleAr: 'بروتوكول إعادة تأهيل الرباط الصليبي الأمامي (ما بعد الجراحة)',
    diagnosisCode: 'S83.51',
    bodyRegion: 'KNEE',
    category: 'SPORTS',
    description: 'Evidence-based criterion-driven rehabilitation protocol following Anterior Cruciate Ligament (ACL) reconstruction using patellar tendon or hamstring autograft.',
    descriptionAr: 'بروتوكول علاجي مبني على الأدلة السريرية لإعادة تأهيل مرضى إعادة بناء الرباط الصليبي الأمامي وفق مراحل التعافي البيولوجي للرقعة.',
    expectedDurationWeeks: 24,
    evidenceSource: 'APTA Clinical Practice Guidelines & JOSPT 2024',
    successRatePct: 88,
    precautions: [
      'تجنب التمديد الكامل المفتوح للركبة بالأوزان (Open kinetic chain 45° to 0°) في أول 6 أسابيع',
      'تجنب أي حركات دورانية أو قفز قبل إتمام 16 أسبوعاً واختبارات القوة',
      'مراقبة أي ارتشاح مفصلي أو ألم في موضع الرقعة',
    ],
    phases: [
      {
        phaseNumber: 1,
        title: 'Immediate Post-Op & Protection',
        titleAr: 'المرحلة الأولى: الحماية وتخفيف الألم والالتهاب',
        weeks: '0 - 2 أسابيع',
        goals: ['Full passive knee extension', 'Quad activation with superior patellar glide', 'Control swelling'],
        goalsAr: ['استعادة الفرد الكامل السلبي للركبة (0 درجة)', 'تفعيل العضلة الرباعية (Quad Sets)', 'السيطرة على التورم والألم'],
        modalities: ['Cryotherapy', 'NMES (Neuromuscular Electrical Stimulation)', 'Compression'],
        modalitiesAr: ['العلاج بالتبريد وكمادات الثلج', 'التنبيه الكهربائي العصبي العضلي (NMES)', 'الضغط وتصريف السوائل'],
        precautions: ['عدم المشي بدون عكازات أو دعامة الركبة المقفولة', 'تجنب ثني الركبة أكثر من 90 درجة في أول أسبوعين'],
        precautionsAr: ['عدم المشي بدون العكازات', 'تجنب الثني الزائد عن 90 درجة'],
        recommendedExercises: ['Isometric Quad Sets', 'Patellar Mobilization', 'Straight Leg Raise with brace', 'Ankle Pumps', 'Passive Extension Hangs'],
      },
      {
        phaseNumber: 2,
        title: 'Early Mobility & Weight Bearing',
        titleAr: 'المرحلة الثانية: استعادة المدى الحركي والمشي الطبيعي',
        weeks: '2 - 6 أسابيع',
        goals: ['Normal gait without crutches', 'Flexion > 120°', 'Single leg balance baseline'],
        goalsAr: ['استعادة نمط المشي الطبيعي بدون عكازات', 'مدى ثني أكثر من 120 درجة', 'التوازن على ساق واحدة'],
        modalities: ['Stationary cycling', 'Thermotherapy for tissue elongation'],
        modalitiesAr: ['الدراجة الثابتة لمجال الحركة', 'التحفيز الحركي الخفيف'],
        precautions: ['تجنب المشي مع عرج أو ثني الركبة', 'التوقف عند حدوث سخونة أو تورم مفاجئ'],
        precautionsAr: ['تجنب المشي مع انثناء الركبة', 'مراقبة التورم بعد الجلسة'],
        recommendedExercises: ['Stationary Bike (half to full revolution)', 'Mini Squats (0-45°)', 'Calf Raises', 'Hamstring Curls', 'Proprioceptive Single Leg Stance'],
      },
      {
        phaseNumber: 3,
        title: 'Strengthening & Neuromuscular Control',
        titleAr: 'المرحلة الثالثة: تقوية العضلات والتحكم العصبي العضلي',
        weeks: '6 - 12 أسبوعاً',
        goals: ['Full ROM equal to contralateral', 'Quad limb symmetry index > 70%', 'Symmetric step down'],
        goalsAr: ['مدى حركي كامل ومطابق للساق السليمة', 'قوة العضلة الرباعية لا تقل عن 70% من السليمة', 'نزول السلم بسلاسة'],
        modalities: ['Leg Press', 'Resistance bands', 'Balance boards'],
        modalitiesAr: ['أجهزة المقاومة المغلقة (Leg Press)', 'ألواح التوازن الحركي'],
        precautions: ['تجنب أجهزة الركل المفتوح بأوزان ثقيلة', 'الحفاظ على محاذاة الركبة مع أصابع القدم أثناء السكوات'],
        precautionsAr: ['منع تقوس الركبة للداخل (Valgus Collapse)'],
        recommendedExercises: ['Leg Press (0-90°)', 'Step-ups & Step-downs', 'Romanian Deadlifts', 'Banded Lateral Walks', 'Perturbation Balance Training'],
      },
      {
        phaseNumber: 4,
        title: 'Advanced Conditioning & Return to Sport',
        titleAr: 'المرحلة الرابعة: الرشاقة والعودة التدريجية للرياضة',
        weeks: '12 - 24+ أسبوعاً',
        goals: ['Limb symmetry index > 90%', 'Pass hop test battery', 'Psychological readiness (ACL-RSI > 75)'],
        goalsAr: ['تماثل قوة الطرفين بنسبة تفوق 90%', 'اجتياز اختبارات الوثب الرباعية', 'الجاهزية النفسية للعودة'],
        modalities: ['Agility ladders', 'Plyometrics', 'Field drills'],
        modalitiesAr: ['تدريبات السرعة والرشاقة', 'تدريبات القفز والهبوط الصحيح (Plyometrics)'],
        precautions: ['عدم العودة للمباريات التنافسية قبل الحصول على تصريح طبي واجتياز المعايير الحركية'],
        precautionsAr: ['عدم التسرع في مباريات التلامس الكامل قبل 6-9 أشهر'],
        recommendedExercises: ['Forward / Lateral Deceleration drills', 'Box Jumps with soft landing', 'Cutting & Pivoting drills', 'Sport-specific conditioning'],
      },
    ],
  },
  {
    title: 'Lumbar Radiculopathy & Disc Herniation Protocol',
    titleAr: 'بروتوكول الانزلاق الغضروفي القطني وعرق النسا',
    diagnosisCode: 'M54.4',
    bodyRegion: 'LUMBAR',
    category: 'ORTHOPEDIC',
    description: 'Conservative mechanical and active rehabilitation pathway for acute/subacute lumbar disc herniation with or without nerve root compression.',
    descriptionAr: 'مسار علاجي تأهيلي ميكانيكي وحركي لمرضى الانزلاق الغضروفي القطني والاعتلال الجذري العصبي لتقليل الألم وتحسين التمركز.',
    expectedDurationWeeks: 10,
    evidenceSource: 'North American Spine Society (NASS) Guidelines & McKenzie Approach',
    successRatePct: 84,
    precautions: [
      'فحص العلامات الحمراء فوراً (Cauda Equina: خدر المنطقة التناسلية، فقدان التحكم بالإخراج، ضعف حاد في القدم)',
      'تجنب حمل الأوزان مع انحناء الجذع للأمام والدوران في نفس الوقت',
      'تجنب الجلوس المتواصل لفترات طويلة على مقاعد منخفضة',
    ],
    phases: [
      {
        phaseNumber: 1,
        title: 'Acute Pain Centralization & Nerve Gliding',
        titleAr: 'المرحلة الأولى: تمركز الألم وتقليل تهيج العصب',
        weeks: '0 - 3 أسابيع',
        goals: ['Centralization of radicular symptoms', 'Tolerate 20 min walking', 'Postural pain relief'],
        goalsAr: ['تمركز الألم وانحساره من الساق نحو أسفل الظهر', 'تحمل المشي 20 دقيقة', 'تعديل وضعية الجلوس لتخفيف الضغط'],
        modalities: ['Mechanical Lumbar Traction (if indicated)', 'TENS / Moist Heat', 'Sciatic Nerve Flossing'],
        modalitiesAr: ['الشد الفقري الخفيف', 'العلاج الكهربائي لتسكين الألم (TENS)', 'تحريك العصب الوركي (Nerve Flossing)'],
        precautions: ['عدم الاستمرار في أي تمرين يؤدي لزيادة انتشار الألم في الساق (Peripheralization)'],
        precautionsAr: ['إيقاف التمارين التي تزيد خدر القدم أو الألم لأسفل'],
        recommendedExercises: ['Prone on Elbows (McKenzie Extension)', 'Sciatic Nerve Slider / Tensioner', 'Supine Pelvic Tilts', 'Gentle Walking Program', 'Log-roll technique for bed transitions'],
      },
      {
        phaseNumber: 2,
        title: 'Core Stabilization & Segmental Motor Control',
        titleAr: 'المرحلة الثانية: تثبيت الجذع وإعادة برمجة العضلات العميقة',
        weeks: '3 - 6 أسابيع',
        goals: ['Independent activation of Transversus Abdominis', 'Neutral spine in ADLs', 'Pain score < 3/10'],
        goalsAr: ['تفعيل العضلات العميقة للجذع (Transversus Abdominis & Multifidus)', 'الحفاظ على استقامة العمود الفقري أثناء الأنشطة اليومية'],
        modalities: ['Biofeedback pressure unit', 'Therapeutic ball'],
        modalitiesAr: ['تغذية راجعة لضغط أسفل الظهر', 'كرة التمارين العلاجية'],
        precautions: ['تجنب تمرين البطن التقليدي (Sit-ups) التي تزيد الضغط على الغضاريف'],
        precautionsAr: ['تجنب تمارين ثني الجذع العنيف'],
        recommendedExercises: ['Dead Bug with neutral spine', 'Bird Dog exercise', 'Side Planks on knees', 'Glute Bridges', 'Hip Hinge mechanics practice'],
      },
      {
        phaseNumber: 3,
        title: 'Functional Conditioning & Relapse Prevention',
        titleAr: 'المرحلة الثالثة: التأهيل الوظيفي والحماية من الانتكاس',
        weeks: '6 - 10 أسابيع',
        goals: ['Lifting mechanics mastery', 'Return to work & regular physical exercise', 'Zero radicular symptoms'],
        goalsAr: ['إتقان تقنيات الرفع الآمن للأوزان', 'العودة لممارسة العمل والحياة الطبيعية بأمان', 'القضاء التام على ألم العصب'],
        modalities: ['Functional gym equipment', 'Resistance bands'],
        modalitiesAr: ['تمارين المقاومة الوظيفية', 'أحزمة المقاومة الحركية'],
        precautions: ['المحافظة الدائمة على إحماء عضلات الظهر قبل المجهود البدني'],
        precautionsAr: ['تجنب الجلوس الخاطئ أثناء قيادة السيارة أو العمل'],
        recommendedExercises: ['Suitcase Carry (Anti-lateral flexion)', 'Pallof Press (Anti-rotation)', 'Goblet Squats with hip hinge', 'Farmers Walk', 'Ergonomic functional lifting'],
      },
    ],
  },
  {
    title: 'Rotator Cuff Tendinopathy & Subacromial Pain Protocol',
    titleAr: 'بروتوكول أوتار الكفة المدورة ومتلازمة اصطدام الكتف',
    diagnosisCode: 'M75.1',
    bodyRegion: 'SHOULDER',
    category: 'ORTHOPEDIC',
    description: 'Staged progressive loading protocol for supraspinatus/infraspinatus tendinopathy, subacromial bursitis, and shoulder impingement.',
    descriptionAr: 'بروتوكول التحميل التدريجي لأوتار الكفة المدورة ومتلازمة الاحتكاك تحت الأخرم لتسكين الألم وتقوية عضلات لوح الكتف.',
    expectedDurationWeeks: 8,
    evidenceSource: 'British Elbow & Shoulder Society (BESS) Evidence Guidelines',
    successRatePct: 91,
    precautions: [
      'تجنب الحركات المفاجئة السريعة فوق مستوى الرأس في المرحلة الحادة',
      'التوقف في حال وجود ألم ليلي حاد ومتواصل غير مستجيب للراحة واستشارة الطبيب المعالج',
      'تجنب الرفع في مستوى التدوير الداخلي (Internal rotation) كوضعية الإفراغ الكامل',
    ],
    phases: [
      {
        phaseNumber: 1,
        title: 'Pain Relief & Scapular Setting',
        titleAr: 'المرحلة الأولى: تسكين الألم وضبط لوح الكتف',
        weeks: '0 - 3 أسابيع',
        goals: ['Reduce resting pain to < 2/10', 'Active scapular retraction without substitution', 'Pain-free below 90° elevation'],
        goalsAr: ['تخفيض ألم الراحة', 'تفعيل عضلات لوح الكتف السفلية والوسطى', 'حركة حرة بدون ألم أسفل مستوى الكتف'],
        modalities: ['Laser therapy / Ultrasound', 'Therapeutic Taping', 'Moist Heat'],
        modalitiesAr: ['العلاج بالليزر والموجات فوق الصوتية', 'الشريط اللاصق الحركي (Kinesio Tape)', 'الكمادات الدافئة'],
        precautions: ['تجنب رفع الذراع لأعلى مع دوران داخلي (Empty Can test position)'],
        precautionsAr: ['تجنب الأوزان الحرة فوق مستوى الكتف'],
        recommendedExercises: ['Isometric External Rotation in neutral', 'Scapular Squeezes / Setting', 'Pendulum Exercises (Codman)', 'Posterior Capsule Stretch', 'Wall slides below shoulder level'],
      },
      {
        phaseNumber: 2,
        title: 'Isotonic Loading & Rotator Cuff Strengthening',
        titleAr: 'المرحلة الثانية: تقوية الكفة المدورة بالتحميل التدريجي',
        weeks: '3 - 6 أسابيع',
        goals: ['Full active overhead reach without shrug', 'External rotation strength equalizing', 'Improve endurance'],
        goalsAr: ['رفع الذراع بالكامل بدون رفع الكتف للأعلى (No shrugging)', 'تقوية الدوران الخارجي للكتف', 'تحسين التحمل العضلي'],
        modalities: ['Therabands (Yellow to Green)', 'Light dumbbells (1-3 kg)'],
        modalitiesAr: ['أحزمة المقاومة المطاطية', 'الأوزان اليدوية الخفيفة'],
        precautions: ['تجنب الإجهاد المفرط أو التمارين المؤلمة بدرجة تتجاوز 4 من 10'],
        precautionsAr: ['الألم أثناء التمرين يجب ألا يتجاوز 4/10 وأن يهدأ بعد الجلسة'],
        recommendedExercises: ['Side-lying External Rotation', 'Face Pulls with resistance band', 'Serratus Anterior Wall Slides with lift-off', 'Prone Y-T-W raises', 'Low row with scapular retraction'],
      },
      {
        phaseNumber: 3,
        title: 'Dynamic Overhead Stability & Functional Return',
        titleAr: 'المرحلة الثالثة: الثبات الديناميكي فوق مستوى الرأس والعودة للأنشطة',
        weeks: '6 - 8+ أسابيع',
        goals: ['Overhead carrying without pain', 'Return to swimming, gym, or manual work', 'Zero impingement signs'],
        goalsAr: ['القدرة على حمل الأشياء فوق الرأس بأمان', 'العودة للسباحة أو الجيم أو الأنشطة اليومية', 'اختفاء علامات الاحتكاك'],
        modalities: ['Kettlebells', 'Plyometric balls'],
        modalitiesAr: ['أثقال الكيتل بيل (Kettlebell)', 'الكرات الطبية الخفيفة'],
        precautions: ['الحفاظ على تكنيك الدفع والسحب السليم في الجيم'],
        precautionsAr: ['تجنب وضعيات الدفع الخلفي للبار خلف الرقبة'],
        recommendedExercises: ['Bottoms-up Kettlebell Press', 'Push-up plus on floor', 'Dynamic Hugs with resistance', 'Overhead Farmer Walk', 'Medicine ball chest passes'],
      },
    ],
  },
  {
    title: 'Cervical Spondylosis & Postural Neck Pain Protocol',
    titleAr: 'بروتوكول خشونة الرقبة ومتلازمة آلام العنق الوضعية',
    diagnosisCode: 'M47.8',
    bodyRegion: 'CERVICAL',
    category: 'ORTHOPEDIC',
    description: 'Evidence-based manual and active exercise program for cervical degenerative disc changes, postural kyphosis, and upper cross syndrome.',
    descriptionAr: 'بروتوكول علاجي متكامل لعلاج آلام الرقبة الناتجة عن الخشونة ومتلازمة الاستخدام الخاطئ للأجهزة الإلكترونية (Text Neck).',
    expectedDurationWeeks: 6,
    evidenceSource: 'APTA Neck Pain Clinical Practice Guideline (JOSPT)',
    successRatePct: 89,
    precautions: [
      'فحص شرايين الرقبة وقاع الجمجمة (Cervical Arterial Dysfunction - 5Ds: Dizziness, Diplopia, Dysarthria, Dysphagia, Drop attacks)',
      'تجنب الطقطقة العنيفة أو الحركات المفاجئة في وجود دوخة أو غثيان',
      'تجنب ثني الرقبة للأمام فترات طويلة أثناء استخدام الهاتف المحمول',
    ],
    phases: [
      {
        phaseNumber: 1,
        title: 'Mobility & Deep Neck Flexor Activation',
        titleAr: 'المرحلة الأولى: تليين المفاصل وتفعيل عضلات العنق العميقة',
        weeks: '0 - 2 أسابيع',
        goals: ['Relieve cervicogenic headaches', 'Restore 80% rotation', 'Activate Longus Colli'],
        goalsAr: ['تخفيف الصداع العنقي وتشنج عضلات شبه المنحرفة', 'استعادة 80% من حركة الدوران', 'تفعيل عضلات الرقبة العميقة'],
        modalities: ['Manual Cervical Traction', 'Moist Heat & TENS', 'Trigger point release'],
        modalitiesAr: ['الشد اليدوي للعنق', 'الكمادات الدافئة والكهرباء المسكنة', 'إرخاء النقاط الزنادية (Trigger Points)'],
        precautions: ['التوقف الفوري في حال حدوث دوار أو زغللة في العين'],
        precautionsAr: ['مراقبة أي أعراض دوار أو خفقان'],
        recommendedExercises: ['Chin Tucks in supine (Craniocervical flexion)', 'Levator Scapulae & Upper Trap gentle stretch', 'Thoracic Extension on foam roller', 'Isometric neck rotation'],
      },
      {
        phaseNumber: 2,
        title: 'Postural Realignment & Thoracic Mobility',
        titleAr: 'المرحلة الثانية: إعادة استقامة القوام وتحريك الفقرات الصدرية',
        weeks: '2 - 4 أسابيع',
        goals: ['Full cervical rotation bilaterally', 'Endurance of deep neck flexors > 30s', 'Erect sitting without fatigue'],
        goalsAr: ['دوران الرقبة كاملاً على الجانبين', 'تحمل عضلات الرقبة العميقة لأكثر من 30 ثانية', 'الجلوس السليم بدون إجهاد'],
        modalities: ['Resistance bands', 'Foam roller'],
        modalitiesAr: ['أحزمة المقاومة', 'الأسطوانة الرغوية (Foam Roller)'],
        precautions: ['المحافظة على وضعية الذقن للداخل أثناء تقوية الكتف'],
        precautionsAr: ['تجنب اندفاع الرأس للأمام'],
        recommendedExercises: ['Seated Chin Tuck with band resistance', 'Open Book Thoracic Mobility', 'Prone Cobra exercise', 'Scapular retraction with external rotation'],
      },
      {
        phaseNumber: 3,
        title: 'Cervical Endurance & Ergonomic Mastery',
        titleAr: 'المرحلة الثالثة: تعزيز التحمل والوقاية في بيئة العمل',
        weeks: '4 - 6 أسابيع',
        goals: ['Workplace workstation optimized', 'Zero headaches after 8-hour workday', 'Full functional range of motion'],
        goalsAr: ['تطبيق بيئة العمل المريحة (Ergonomics)', 'العمل 8 ساعات بدون صداع أو شد عنقي', 'مدى حركي ومرونة ممتازة'],
        modalities: ['Ergonomic support cushions', 'Strength training'],
        modalitiesAr: ['الوسائد الطبية وتعديل شاشات العمل', 'تمارين المقاومة الحرة'],
        precautions: ['أخذ استراحة حركية دقيقة واحدة كل 45 دقيقة من العمل المكتبي'],
        precautionsAr: ['تغيير وضعية الجلوس بانتظام'],
        recommendedExercises: ['Dynamic neck isometric holds in all directions', 'Standing W-to-Y raises', 'Banded Face pulls with posture hold', 'Functional workstation mobility breaks'],
      },
    ],
  },
  {
    title: 'Post-Stroke Functional Neuromotor Recovery Protocol',
    titleAr: 'بروتوكول التأهيل الحركي والعصبي بعد السكتة الدماغية',
    diagnosisCode: 'I69.3',
    bodyRegion: 'NEURO',
    category: 'NEUROLOGICAL',
    description: 'Task-oriented neuroplasticity protocol focusing on functional ambulation, spasticity control, balance, and activities of daily living.',
    descriptionAr: 'بروتوكول مبني على المرونة العصبية (Neuroplasticity) لإعادة تعليم الجهاز العصبي استعادة التوازن والمشي واستخدام الطرف المصاب.',
    expectedDurationWeeks: 16,
    evidenceSource: 'American Heart Association / American Stroke Association Rehabilitation Guidelines',
    successRatePct: 79,
    precautions: [
      'فحص ضغط الدم ومعدل النبض قبل وبداية كل جلسة علاجية',
      'حماية مفصل الكتف المصاب بالضعف باستخدام حمالة لتجنب خلع أو هبوط المفصل (Shoulder Subluxation)',
      'تأمين المريض بحزام المشي (Gait Belt) لتفادي خطر السقوط تماماً',
    ],
    phases: [
      {
        phaseNumber: 1,
        title: 'Early Bed Mobility & Subluxation Prevention',
        titleAr: 'المرحلة الأولى: الحركة في السرير وحماية المفصل من الخلع',
        weeks: '0 - 4 أسابيع',
        goals: ['Independent rolling in bed', 'Sitting balance unsupported for 5 mins', 'Prevent shoulder subluxation & contractures'],
        goalsAr: ['التقلب المستقل في السرير', 'التوازن جالساً بدون مسند لمدة 5 دقائق', 'منع تيبس المفاصل وحماية الكتف من الخلع'],
        modalities: ['Functional Electrical Stimulation (FES)', 'Positioning Splints & Slings'],
        modalitiesAr: ['التحفيز الكهربائي الوظيفي (FES)', 'جبائر التثبيت ودعامات الكتف المانعة للخلع'],
        precautions: ['ممنوع سحب المريض من الذراع المصابة نهائياً عند مساعدته على النهوض'],
        precautionsAr: ['عدم جذب الذراع المصابة إطلاقاً'],
        recommendedExercises: ['Bridging in bed with paretic leg assistance', 'Assisted trunk rolling', 'Weight bearing on hemiplegic arm in sitting', 'Passive-to-active ROM for all major joints'],
      },
      {
        phaseNumber: 2,
        title: 'Sit-to-Stand & Weight Transfer',
        titleAr: 'المرحلة الثانية: الانتقال من الجلوس للوقوف ونقل الوزن',
        weeks: '4 - 8 أسابيع',
        goals: ['Independent sit-to-stand with equal weight distribution', 'Static standing balance > 60s', 'Reduce lower extremity spasticity'],
        goalsAr: ['الوقوف من الكرسي مع توزيع الوزن بالتساوي بين الساقين', 'التوازن واقفاً لأكثر من دقيقة', 'تقليل الشد التشنجي في الساق'],
        modalities: ['Parallel Bars', 'Weight-bearing biofeedback scale'],
        modalitiesAr: ['المتوازي الطبي (Parallel bars)', 'ميزان قياس توزيع الوزن'],
        precautions: ['التأكد من قفل الركبة المصابة أثناء الوقوف لتجنب الانثناء المفاجئ'],
        precautionsAr: ['تأمين الركبة ومراقبة ثباتها'],
        recommendedExercises: ['Sit-to-Stand repetitions from high to normal chair', 'Weight shifting side-to-side and front-to-back', 'Step taps onto low block with sound limb', 'Pelvic tilt control in standing'],
      },
      {
        phaseNumber: 3,
        title: 'Task-Oriented Gait & Spasticity Control',
        titleAr: 'المرحلة الثالثة: تدريب المشي الوظيفي والتحكم بالتشنج',
        weeks: '8 - 12 أسبوعاً',
        goals: ['Independent ambulation with or without AFO / quad cane', 'Gait speed > 0.4 m/s', 'Active reach with hemiplegic arm'],
        goalsAr: ['المشي المستقل بالدعامة أو العصا الرباعية', 'زيادة سرعة المشي', 'مد الذراع المصابة لالتقاط الأهداف'],
        modalities: ['Treadmill with partial body weight support', 'Targeted neuromuscular stimulation'],
        modalitiesAr: ['جهاز المشي مع تعليق الوزن الجزئي', 'التحفيز العصبي لعضلات رفع مشط القدم (Dorsiflexors)'],
        precautions: ['مراقبة دوران القدم للداخل (Inversion) لتجنب التواء الكاحل'],
        precautionsAr: ['استخدام دعامة الكاحل (AFO) عند الحاجة'],
        recommendedExercises: ['Forward and backward walking in parallel bars', 'Obstacle clearance step-over drills', 'Reach-to-grasp functional task training', 'Calf stretching & ankle dorsiflexion active training'],
      },
      {
        phaseNumber: 4,
        title: 'Community Mobility & Advanced Activities',
        titleAr: 'المرحلة الرابعة: الحركة المجتمعية وصعود الدرج والاندماج',
        weeks: '12 - 16+ أسبوعاً',
        goals: ['Climb 1 flight of stairs safely', 'Outdoor uneven terrain walking', 'Perform bilateral hand tasks in daily routine'],
        goalsAr: ['صعود الدرج ونزوله بأمان', 'المشي على الأسطح غير المستوية', 'استخدام اليدين معاً في الحياة اليومية'],
        modalities: ['Stair trainers', 'Agility cones', 'Constraint-Induced Movement (CIMT)'],
        modalitiesAr: ['درج التدريب الطبي', 'التدريب الحركي المكثف لليد (CIMT)'],
        precautions: ['المتابعة المستمرة لمنع السقوط في البيئة الخارجية'],
        precautionsAr: ['الحذر على الأسطح المبتلة أو غير المستوية'],
        recommendedExercises: ['Stair climbing (Up with sound, down with paretic)', 'Dual-task cognitive walking drills', 'Outdoor ground navigation', 'Fine motor finger dexterity puzzles'],
      },
    ],
  },
  {
    title: 'Plantar Fasciitis & Heel Pain Protocol',
    titleAr: 'بروتوكول التهاب اللفافة الأخمصية وشوكة القدم',
    diagnosisCode: 'M72.2',
    bodyRegion: 'ANKLE',
    category: 'ORTHOPEDIC',
    description: 'Evidence-based mechanical offloading and high-load strength training (Rathleff protocol) for persistent plantar fasciopathy and heel pain.',
    descriptionAr: 'بروتوكول علاجي مبني على الأدلة السريرية يتضمن تخفيف التحمل الحاد ثم تدريب أوتار القدم بأوزان بطيئة (بروتوكول راثليف).',
    expectedDurationWeeks: 8,
    evidenceSource: 'JOSPT Heel Pain Guidelines & Rathleff Heavy-Slow Resistance Protocol',
    successRatePct: 92,
    precautions: [
      'تجنب المشي حافياً تماماً على الأرضيات الصلبة أو البلاط والرخام',
      'تجنب الجري أو الرياضات ذات الصدمات العالية في أول 4 أسابيع',
      'استخدام أحذية مبطنة بكعب سميك ممتص للصدمات أو فرشة طبية مقوسة',
    ],
    phases: [
      {
        phaseNumber: 1,
        title: 'Tissue Offloading & First-Step Pain Relief',
        titleAr: 'المرحلة الأولى: تخفيف الحمل وتسكين ألم الخطوة الأولى صباحاً',
        weeks: '0 - 3 أسابيع',
        goals: ['Reduce morning first-step pain by > 50%', 'Pain-free 15 min walk with orthotics', 'Gastrocnemius flexibility restoration'],
        goalsAr: ['تخفيض ألم الخطوة الأولى عند الاستيقاظ بنسبة 50%', 'المشي 15 دقيقة بالحذاء الطبي بدون ألم حاد', 'استعادة مرونة بطة الساق'],
        modalities: ['Low-Dye Taping', 'Shockwave Therapy (ESWT) if available', 'Ice bottle rolling'],
        modalitiesAr: ['الشريط الداعم لقوس القدم (Low-Dye Tape)', 'الموجات التصادمية (Shockwave)', 'دحرجة قارورة ماء مثلجة تحت القدم'],
        precautions: ['عدم النزول من السرير مباشرة صباحاً دون تدليك وتمطيط أصابع القدم أولاً'],
        precautionsAr: ['تجنب المشي حافياً'],
        recommendedExercises: ['Plantar Fascia specific stretch (toes into dorsiflexion)', 'Calf stretch with towel in bed before rising', 'Frozen water bottle roll (5-10 min)', 'Toe scrunches on towel', 'Ankle alphabets'],
      },
      {
        phaseNumber: 2,
        title: 'Heavy Slow Resistance (Rathleff Loading)',
        titleAr: 'المرحلة الثانية: بروتوكول التحميل البطيء عالي المقاومة (راثليف)',
        weeks: '3 - 6 أسابيع',
        goals: ['Perform 3x12 heel raises on towel roll with minimal pain', 'Tolerate 30 min continuous walking', 'Pain score < 2/10'],
        goalsAr: ['إتمام تمرين رفع الكعب فوق منشفة ملفوفة (آلية ونش القوس)', 'تحمل المشي المتواصل 30 دقيقة', 'ألم أقل من 2 من 10'],
        modalities: ['Custom Orthotic insoles', 'Weight vests / Backpack for progressive loading'],
        modalitiesAr: ['الفرشات الطبية المخصصة لقوس القدم', 'أثقال خفيفة لزيادة التحمل'],
        precautions: ['الرفع يستغرق 3 ثواني صعوداً وثانيتين ثبات و3 ثواني هبوطاً بدون سرعة أو ارتداد'],
        precautionsAr: ['الحفاظ على سرعة التمرين البطيئة المتحكم بها'],
        recommendedExercises: ['Rathleff Heel Raise (towel under toes to engage windlass)', 'Soleus bent-knee calf raise', 'Single-leg balance on foam pad', 'Eccentric gastrocnemius drops'],
      },
      {
        phaseNumber: 3,
        title: 'Impact Reintegration & Long-term Prevention',
        titleAr: 'المرحلة الثالثة: العودة للأنشطة الرياضية والوقاية المستمرة',
        weeks: '6 - 8+ أسابيع',
        goals: ['Return to running or high-impact sport without next-day stiffness', 'Complete pain resolution', 'Strong intrinsic foot musculature'],
        goalsAr: ['العودة للجري أو الرياضة بدون تيبس صباحي في اليوم التالي', 'اختفاء الألم بنسبة كاملة', 'قوة واستقرار عضلات القدم الداخلية'],
        modalities: ['Footwear assessment', 'Gradual impact progression'],
        modalitiesAr: ['فحص ملاءمة الحذاء الرياضي', 'التدرج في الجري والمشي السريع'],
        precautions: ['زيادة المسافة أو السرعة بمعدل لا يتجاوز 10% أسبوعياً'],
        precautionsAr: ['التدرج في الأحمال وعدم القفز المفاجئ في المسافات'],
        recommendedExercises: ['Skipping rope progression on soft mat', 'Short foot exercise (Janda arch activation)', 'Barefoot walking on grass/sand progressively', 'Dynamic bounding & calf plyometrics'],
      },
    ],
  },
];

export async function seedDefaultProtocolsIfEmpty() {
  const count = await prisma.treatmentProtocol.count();
  if (count === 0) {
    for (const proto of DEFAULT_PROTOCOLS) {
      await prisma.treatmentProtocol.create({
        data: {
          title: proto.title,
          titleAr: proto.titleAr,
          diagnosisCode: proto.diagnosisCode || null,
          bodyRegion: proto.bodyRegion,
          category: proto.category,
          description: proto.description,
          descriptionAr: proto.descriptionAr,
          phases: proto.phases as any,
          expectedDurationWeeks: proto.expectedDurationWeeks || 12,
          evidenceSource: proto.evidenceSource,
          precautions: proto.precautions,
          successRatePct: proto.successRatePct || 85,
          isActive: true,
        },
      });
    }
  }
}

export async function listProtocols(filters?: {
  bodyRegion?: string;
  category?: string;
  search?: string;
}) {
  await seedDefaultProtocolsIfEmpty();

  const where: any = { isActive: true };

  if (filters?.bodyRegion && filters.bodyRegion !== 'ALL') {
    where.bodyRegion = filters.bodyRegion.toUpperCase();
  }

  if (filters?.category && filters.category !== 'ALL') {
    where.category = filters.category.toUpperCase();
  }

  if (filters?.search) {
    const s = filters.search.trim();
    where.OR = [
      { title: { contains: s, mode: 'insensitive' } },
      { titleAr: { contains: s, mode: 'insensitive' } },
      { description: { contains: s, mode: 'insensitive' } },
      { descriptionAr: { contains: s, mode: 'insensitive' } },
      { diagnosisCode: { contains: s, mode: 'insensitive' } },
    ];
  }

  return prisma.treatmentProtocol.findMany({
    where,
    orderBy: { titleAr: 'asc' },
  });
}

export async function getProtocolById(id: string) {
  const protocol = await prisma.treatmentProtocol.findUnique({
    where: { id },
  });

  if (!protocol) {
    throw new HttpError(404, 'Treatment protocol not found');
  }

  return protocol;
}

export async function createProtocol(data: CreateProtocolDto) {
  return prisma.treatmentProtocol.create({
    data: {
      ...data,
      phases: data.phases as any,
    },
  });
}

export async function updateProtocol(id: string, data: Partial<CreateProtocolDto>) {
  const existing = await prisma.treatmentProtocol.findUnique({ where: { id } });
  if (!existing) {
    throw new HttpError(404, 'Protocol not found');
  }

  return prisma.treatmentProtocol.update({
    where: { id },
    data: {
      ...data,
      ...(data.phases && { phases: data.phases as any }),
    },
  });
}

export async function deleteProtocol(id: string) {
  const existing = await prisma.treatmentProtocol.findUnique({ where: { id } });
  if (!existing) {
    throw new HttpError(404, 'Protocol not found');
  }

  return prisma.treatmentProtocol.update({
    where: { id },
    data: { isActive: false },
  });
}

// ─── CLINICAL DECISION SUPPORT ENGINE ───

export interface DiagnosisSuggestionInput {
  bodyRegion: string; // KNEE, SHOULDER, LUMBAR, CERVICAL, ANKLE, NEURO
  symptoms?: string;
  painType?: string; // sharp, dull, burning, tingling, aching
  painIntensity?: number; // 0 - 10
  age?: number;
}

export async function suggestDiagnosis(input: DiagnosisSuggestionInput) {
  await seedDefaultProtocolsIfEmpty();

  const region = input.bodyRegion.toUpperCase();
  const symptomsText = (input.symptoms || '').toLowerCase();
  const painType = (input.painType || '').toLowerCase();

  // Find matching protocols for this body region
  const matchingProtocols = await prisma.treatmentProtocol.findMany({
    where: {
      bodyRegion: region,
      isActive: true,
    },
  });

  const suggestions: Array<{
    diagnosis: string;
    diagnosisAr: string;
    icdCode: string;
    confidence: number;
    recommendedPhysicalTests: Array<{ name: string; nameAr: string; purpose: string }>;
    redFlags: string[];
    suggestedProtocolId: string;
    protocolTitle: string;
    protocolTitleAr: string;
    rationale: string;
  }> = [];

  if (region === 'KNEE') {
    const isLigament = symptomsText.includes('pop') || symptomsText.includes('twist') || symptomsText.includes('instab') || symptomsText.includes('طقطق') || symptomsText.includes('التواء') || symptomsText.includes('عدم ثبات');
    const confidence = isLigament ? 92 : 75;

    const matchedProto = matchingProtocols[0] || null;

    suggestions.push({
      diagnosis: 'Anterior Cruciate Ligament (ACL) Sprain / Tear',
      diagnosisAr: 'إصابة أو تمزق في الرباط الصليبي الأمامي للركبة',
      icdCode: 'S83.51',
      confidence,
      recommendedPhysicalTests: [
        { name: 'Lachman Test', nameAr: 'اختبار لاخمان (الأدق لفحص الرباط الصليبي)', purpose: 'Assesses anterior tibial translation at 20-30° flexion (Sensitivity 85%, Specificity 94%)' },
        { name: 'Anterior Drawer Test', nameAr: 'اختبار الدرج الأمامي', purpose: 'Assesses anterior laxity at 90° flexion' },
        { name: 'Pivot Shift Test', nameAr: 'اختبار محور الدوران (Pivot Shift)', purpose: 'Evaluates rotary knee instability' },
      ],
      redFlags: ['Inability to bear weight immediately after injury', 'Rapid onset hemarthrosis (swelling within 2 hours)', 'Locked knee sensation'],
      suggestedProtocolId: matchedProto?.id || '',
      protocolTitle: matchedProto?.title || 'ACL Rehabilitation Protocol',
      protocolTitleAr: matchedProto?.titleAr || 'بروتوكول إعادة تأهيل الرباط الصليبي الأمامي',
      rationale: isLigament
        ? 'Matched due to reported mechanism of injury (twisting/instability/pop).'
        : 'Common clinical presentation for acute to subacute knee joint pain.',
    });
  } else if (region === 'LUMBAR') {
    const isRadicular = symptomsText.includes('rad') || symptomsText.includes('leg') || painType.includes('tingl') || painType.includes('burn') || symptomsText.includes('تنميل') || symptomsText.includes('ساق') || symptomsText.includes('عرق نسا');
    const confidence = isRadicular ? 90 : 80;

    const matchedProto = matchingProtocols[0] || null;

    suggestions.push({
      diagnosis: 'Lumbar Radiculopathy / Disc Herniation',
      diagnosisAr: 'انزلاق غضروفي قطني واعتلال جذور الأعصاب (عرق النسا)',
      icdCode: 'M54.4',
      confidence,
      recommendedPhysicalTests: [
        { name: 'Straight Leg Raise (SLR) Test', nameAr: 'اختبار رفع الساق المستقيمة (Lasègue)', purpose: 'High sensitivity for L4-S1 nerve root irritation (positive between 35° and 70°)' },
        { name: 'Crossed Straight Leg Raise (Well-leg SLR)', nameAr: 'اختبار رفع الساق المعاكسة', purpose: 'High specificity (90%) for disc herniation when positive on contralateral side' },
        { name: 'Slump Test', nameAr: 'اختبار سلامب (Slump Test)', purpose: 'Assesses neural tissue sensitivity and dural mobility' },
      ],
      redFlags: ['Saddle anesthesia', 'New bladder/bowel incontinence (Cauda Equina emergency)', 'Progressive motor foot drop'],
      suggestedProtocolId: matchedProto?.id || '',
      protocolTitle: matchedProto?.title || 'Lumbar Radiculopathy Protocol',
      protocolTitleAr: matchedProto?.titleAr || 'بروتوكول الانزلاق الغضروفي وعرق النسا',
      rationale: isRadicular
        ? 'High probability of neural involvement given reported radiating symptoms/tingling.'
        : 'Mechanical lumbar spine presentation with suspected discogenic strain.',
    });
  } else if (region === 'SHOULDER') {
    const matchedProto = matchingProtocols[0] || null;

    suggestions.push({
      diagnosis: 'Subacromial Impingement & Rotator Cuff Tendinopathy',
      diagnosisAr: 'متلازمة اصطدام الكتف والتهاب أوتار الكفة المدورة',
      icdCode: 'M75.1',
      confidence: 88,
      recommendedPhysicalTests: [
        { name: 'Hawkins-Kennedy Impingement Test', nameAr: 'اختبار هوكينز-كينيدي', purpose: 'Passively internally rotates flexed shoulder; high sensitivity for subacromial bursitis' },
        { name: 'Neer Impingement Sign', nameAr: 'علامة نير للاصطدام', purpose: 'Maximal passive elevation with internal rotation' },
        { name: 'Empty Can (Jobe) Test', nameAr: 'اختبار العلبة الفارغة (جوب)', purpose: 'Isolates Supraspinatus tendon integrity and strength' },
      ],
      redFlags: ['Night pain unresponsive to positional change', 'Total inability to actively abduct above 30° (massive tear rule-out)', 'Unexplained cachexia or fever'],
      suggestedProtocolId: matchedProto?.id || '',
      protocolTitle: matchedProto?.title || 'Rotator Cuff Protocol',
      protocolTitleAr: matchedProto?.titleAr || 'بروتوكول أوتار الكفة المدورة',
      rationale: 'Primary cause of anterolateral shoulder pain exacerbated by overhead reach.',
    });
  } else if (region === 'ANKLE') {
    const matchedProto = matchingProtocols[0] || null;

    suggestions.push({
      diagnosis: 'Plantar Fasciitis / Heel Spur Syndrome',
      diagnosisAr: 'التهاب اللفافة الأخمصية وشوكة الكعب',
      icdCode: 'M72.2',
      confidence: 93,
      recommendedPhysicalTests: [
        { name: 'Windlass Test', nameAr: 'اختبار ونش اللفافة الأخمصية (Windlass)', purpose: 'Passively dorsiflexes hallux to tension plantar fascia and reproduce medial heel pain' },
        { name: 'Tarsal Tunnel Compression Test', nameAr: 'اختبار ضغط النفق الرصغي', purpose: 'Rule out posterior tibial nerve entrapment' },
        { name: 'Direct Medial Calcaneal Palpation', nameAr: 'فحص نقطة ارتكاز اللفافة في عظم الكعب', purpose: 'Point tenderness localized at the medial tubercle' },
      ],
      redFlags: ['Bilateral sudden numbness in both feet', 'Resting calcaneal bone pain at night (calcaneal stress fracture)'],
      suggestedProtocolId: matchedProto?.id || '',
      protocolTitle: matchedProto?.title || 'Plantar Fasciitis Protocol',
      protocolTitleAr: matchedProto?.titleAr || 'بروتوكول التهاب اللفافة الأخمصية',
      rationale: 'Characterized by pain upon first morning steps, localizing to medial plantar heel.',
    });
  } else if (region === 'CERVICAL') {
    const matchedProto = matchingProtocols[0] || null;

    suggestions.push({
      diagnosis: 'Cervical Spondylosis & Postural Neck Pain',
      diagnosisAr: 'خشونة الفقرات العنقية ومتلازمة آلام الرقبة الوضعية',
      icdCode: 'M47.8',
      confidence: 86,
      recommendedPhysicalTests: [
        { name: 'Spurling Test (Neck Compression)', nameAr: 'اختبار سبورلينج للضغط العنقي', purpose: 'High specificity for cervical nerve root radiculopathy' },
        { name: 'Cervical Distraction Test', nameAr: 'اختبار الشد العنقي التسكيني', purpose: 'Reduction of symptoms upon axial traction confirms mechanical radicular decompression' },
        { name: 'Upper Limb Tension Test 1 (Elvey/Median)', nameAr: 'اختبار توتر أعصاب الطرف العلوي (ULTT1)', purpose: 'Tests median nerve sensitivity' },
      ],
      redFlags: ['Cervical myelopathy signs: clumsiness in hands, hyperreflexia, unsteady gait', 'Vertebrobasilar insufficiency (dizziness on rotation)'],
      suggestedProtocolId: matchedProto?.id || '',
      protocolTitle: matchedProto?.title || 'Cervical Spondylosis Protocol',
      protocolTitleAr: matchedProto?.titleAr || 'بروتوكول خشونة الفقرات العنقية',
      rationale: 'Mechanical degenerative or postural strain common with desk workers and prolonged flexion.',
    });
  } else if (region === 'NEURO') {
    const matchedProto = matchingProtocols[0] || null;

    suggestions.push({
      diagnosis: 'Post-Stroke Hemiparesis / Neuromotor Impairment',
      diagnosisAr: 'الضعف الحركي النصفي بعد السكتة الدماغية',
      icdCode: 'I69.3',
      confidence: 95,
      recommendedPhysicalTests: [
        { name: 'Modified Ashworth Scale (MAS)', nameAr: 'مقياس آشورث المعدل لقياس الشد التشنجي', purpose: 'Quantifies muscle spasticity in flexors/extensors' },
        { name: 'Berg Balance Scale (BBS)', nameAr: 'مقياس بيرج للتوازن الوظيفي', purpose: 'Standardized assessment for fall risk in stroke survivors' },
        { name: 'Timed Up and Go (TUG)', nameAr: 'اختبار الوقوف والانطلاق الحركي (TUG)', purpose: 'Assesses mobility, dynamic balance, and transfers' },
      ],
      redFlags: ['Sudden changes in cognitive status or speech', 'Recurrent transient ischemic attacks (TIAs)', 'Severe shoulder pain indicating subluxation'],
      suggestedProtocolId: matchedProto?.id || '',
      protocolTitle: matchedProto?.title || 'Post-Stroke Protocol',
      protocolTitleAr: matchedProto?.titleAr || 'بروتوكول التأهيل العصبي بعد السكتة الدماغية',
      rationale: 'Comprehensive neuro-rehab indicated to optimize neuroplastic recovery and mobility.',
    });
  }

  return {
    input,
    suggestions,
    evidenceTimestamp: new Date().toISOString(),
  };
}

export interface OutcomePredictionInput {
  diagnosis: string;
  initialPain: number; // 0 - 10
  age?: number;
  adherenceScore?: number; // 0 - 100%
  baselineMobility?: 'POOR' | 'MODERATE' | 'GOOD';
}

export async function predictOutcome(input: OutcomePredictionInput) {
  const pain = Math.max(0, Math.min(10, input.initialPain || 7));
  const age = input.age || 35;
  const adherence = input.adherenceScore !== undefined ? input.adherenceScore : 85;

  // Predictive adjustments
  const adherenceFactor = adherence >= 80 ? 1.15 : adherence >= 60 ? 1.0 : 0.8;
  const ageFactor = age < 30 ? 1.1 : age < 50 ? 1.0 : age < 65 ? 0.9 : 0.82;

  const baseSuccessRate = 85;
  const successProbability = Math.min(96, Math.max(60, Math.round(baseSuccessRate * (adherenceFactor * 0.6 + ageFactor * 0.4))));

  const totalEstimatedWeeks = Math.max(4, Math.round((pain * 1.2) * (1 / (adherenceFactor * ageFactor))));

  // Trajectory curve
  const painTrajectory = [
    { week: 0, painLevel: pain, description: 'مستوى الألم الحالي عند بدء العلاج' },
    { week: Math.round(totalEstimatedWeeks * 0.25), painLevel: Math.round(pain * 0.7 * 10) / 10, description: 'المرحلة الأولى: انحسار الألم الحاد والالتهاب' },
    { week: Math.round(totalEstimatedWeeks * 0.5), painLevel: Math.round(pain * 0.4 * 10) / 10, description: 'المرحلة الثانية: استعادة الحركة والوظيفة اليومية' },
    { week: Math.round(totalEstimatedWeeks * 0.75), painLevel: Math.round(pain * 0.2 * 10) / 10, description: 'المرحلة الثالثة: تقوية العضلات وبناء التحمل' },
    { week: totalEstimatedWeeks, painLevel: Math.round(pain * 0.08 * 10) / 10, description: 'المرحلة الرابعة: الشفاء الوظيفي والعودة للأنشطة الكاملة' },
  ];

  return {
    diagnosis: input.diagnosis,
    successProbability,
    totalEstimatedWeeks,
    painDropPct: 85,
    milestones: [
      { week: 2, milestone: 'تراجع ألم الراحة بنسبة 30% والقدرة على النوم المريح' },
      { week: 4, milestone: 'استعادة 80% من المدى الحركي للمفصل المصاب' },
      { week: 8, milestone: 'أداء التمارين بالمقاومة والأنشطة اليومية بدون عوائق' },
      { week: totalEstimatedWeeks, milestone: 'اجتياز معايير الخروج والوقاية من الانتكاس' },
    ],
    painTrajectory,
    clinicalRecommendations: [
      'الالتزام بالبرنامج الحركي المنزلي يزيد من سرعة التعافي بنسبة 40%',
      'المحافظة على التردد العلاجي المنتظم (جلستان إلى 3 جلسات أسبوعياً في أول شهر)',
      'تجنب الأحمال المفاجئة غير المحسوبة في الأيام الخالية من الألم',
    ],
  };
}

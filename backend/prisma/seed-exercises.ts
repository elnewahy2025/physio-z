// Seed data for Exercise Library
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const exercises = [
  // Stretching Exercises
  {
    name: "Neck Side Stretch",
    nameAr: "تمديد الرقبة الجانبي",
    category: "STRETCHING",
    difficulty: "BEGINNER",
    description: "A gentle stretch for the neck muscles on the side",
    descriptionAr: "تمديد لطيف لعضلات الرقبة الجانبية",
    instructions: "1. Sit or stand with good posture\n2. Tilt your head to one side, bringing your ear towards your shoulder\n3. Hold for 20-30 seconds\n4. Repeat on the other side",
    instructionsAr: "1. اجلس أو قف بوضعية صحيحة\n2. أمِل رأسك إلى جانب واحد، bringing أذنك نحو كتفك\n3. حافظ على الوضعية 20-30 ثانية\n4. كرر على الجانب الآخر",
    position: "SITTING",
    defaultSets: 2,
    defaultReps: 1,
    defaultHoldTime: 30,
    defaultRestTime: 30,
    bodyParts: ["neck", "cervical"],
    tags: ["neck", "stretching", "beginner"],
    equipment: [],
  },
  {
    name: "Cat-Cow Stretch",
    nameAr: "تمديد القطة والبقرة",
    category: "MOBILITY",
    difficulty: "BEGINNER",
    description: "Spine mobility exercise that flexes and extends the back",
    descriptionAr: "تمرين مرونة العمود الفقري الذي يثني ويمد الظهر",
    instructions: "1. Start on hands and knees (quadruped position)\n2. Arch your back up towards ceiling (cat)\n3. Then let your belly drop down while lifting head and tailbone (cow)\n4. Move slowly between positions",
    instructionsAr: "1. ابدأ على اليدين والركبتين (وضعية أربعة)\n2. ارفع ظهرك لأعلى نحو السقف (القطة)\n3. ثم أنزل بطنك لأسفل مع رفع الرأس وعظمة الذيل (البقرة)\n4. تحرك ببطء بين الوضعيتين",
    position: "QUADRUPED",
    defaultSets: 2,
    defaultReps: 10,
    defaultRestTime: 30,
    bodyParts: ["back", "spine", "lumbar"],
    tags: ["spine", "mobility", "back pain"],
    equipment: [],
  },
  
  // Strengthening Exercises
  {
    name: "Bridge",
    nameAr: "الجسر",
    category: "STRENGTHENING",
    difficulty: "BEGINNER",
    description: "Core and glute strengthening exercise",
    descriptionAr: "تمرين لتقوية العضلات الأساسية والأرداف",
    instructions: "1. Lie on your back with knees bent and feet flat on floor\n2. Lift your hips up towards ceiling\n3. Squeeze glutes at the top\n4. Lower slowly and repeat",
    instructionsAr: "1. استلقِ على ظهرك مع ثني الركبتين ووضع القدمين على الأرض\n2. ارفع وركك لأعلى نحو السقف\n3. اضغط على عضلات الأرداف في الأعلى\n4. انزل ببطء وكرر",
    position: "SUPINE",
    defaultSets: 3,
    defaultReps: 12,
    defaultRestTime: 60,
    bodyParts: ["glutes", "hamstrings", "core"],
    tags: ["core", "glutes", "strength"],
    equipment: [],
  },
  {
    name: "Wall Push-ups",
    nameAr: "ضغط الحائط",
    category: "STRENGTHENING",
    difficulty: "BEGINNER",
    description: "Modified push-ups against a wall for upper body strength",
    descriptionAr: "تمرين ضغط معدل على الحائط لتقوية الجزء العلوي من الجسم",
    instructions: "1. Stand facing a wall at arm's length\n2. Place hands on wall at shoulder height\n3. Bend elbows and bring chest towards wall\n4. Push back to starting position",
    instructionsAr: "1. قف مواجهاً للحائط على مسافة ذراع\n2. ضع يديك على الحائط على مستوى الكتف\n3. اثني مرفقيك وقرب صدرك نحو الحائط\n4. ادفع للخلف إلى وضع البداية",
    position: "STANDING",
    defaultSets: 3,
    defaultReps: 10,
    defaultRestTime: 60,
    bodyParts: ["chest", "arms", "shoulders"],
    tags: ["upper body", "push", "beginner"],
    equipment: [],
  },
  
  // Balance Exercises
  {
    name: "Single Leg Stand",
    nameAr: "الوقوف على قدم واحدة",
    category: "BALANCE",
    difficulty: "BEGINNER",
    description: "Basic balance exercise standing on one leg",
    descriptionAr: "تمرين توازن أساسي بالوقوف على قدم واحدة",
    instructions: "1. Stand near a wall or chair for support\n2. Lift one foot off the ground\n3. Balance on the other leg\n4. Hold for 10-30 seconds\n5. Switch legs",
    instructionsAr: "1. قف بالقرب من حائط أو كرسي للدعم\n2. ارفع قدم واحدة عن الأرض\n3. توازن على الساق الأخرى\n4. حافظ على الوضعية 10-30 ثانية\n5. بدل الساقين",
    position: "STANDING",
    defaultSets: 3,
    defaultReps: 1,
    defaultHoldTime: 20,
    defaultRestTime: 30,
    bodyParts: ["legs", "ankles", "core"],
    tags: ["balance", "stability", "fall prevention"],
    equipment: [],
  },
  
  // Cardio Exercises
  {
    name: "Walking",
    nameAr: "المشي",
    category: "CARDIO",
    difficulty: "BEGINNER",
    description: "Basic walking exercise for cardiovascular health",
    descriptionAr: "تمرين المشي الأساسي لصحة القلب والأوعية الدموية",
    instructions: "1. Walk at a comfortable pace\n2. Maintain good posture\n3. Start with 10-15 minutes\n4. Gradually increase duration",
    instructionsAr: "1. امشِ بوتيرة مريحة\n2. حافظ على وضعية جيدة\n3. ابدأ بـ 10-15 دقيقة\n4. زد المدة تدريجياً",
    position: "STANDING",
    defaultSets: 1,
    defaultReps: 1,
    estimatedTime: 20,
    bodyParts: ["legs", "heart"],
    tags: ["cardio", "walking", "endurance"],
    equipment: [],
  },
];

async function seedExercises() {
  console.log('Seeding exercise library...');
  
  for (const exercise of exercises) {
    const existing = await prisma.exercise.findFirst({
      where: {
        OR: [
          { name: exercise.name },
          { nameAr: exercise.nameAr },
        ],
      },
    });
    
    if (!existing) {
      await prisma.exercise.create({
        data: {
          ...exercise,
          createdById: "seed",
        },
      });
      console.log(`✓ Created exercise: ${exercise.name}`);
    } else {
      console.log(`- Exercise already exists: ${exercise.name}`);
    }
  }
  
  console.log('Exercise seeding completed!');
}

seedExercises()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

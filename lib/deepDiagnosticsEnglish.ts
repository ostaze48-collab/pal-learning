import type {DeepDiagnostic} from './deepDiagnostics';

export const englishDeepDiagnostics:DeepDiagnostic[]=[
  {skillId:'english-phonics',subject:'English',title:'Deep phonics check',subskills:[
    {id:'initial-sounds',title:'Initial sounds',gradeAnchor:'Grades 2–3',why:'Weak sound-letter links make decoding slow.',miniLesson:'Say the word slowly and listen to the first sound, then match it to the letter.',treatmentSteps:['5 sound-picture matches','blend 5 short words','read 5 new words'],questions:[
      {id:'is1',text:'Which word starts with /b/?',options:['book','cat','fish','sun'],correct:0,explanation:'book starts with /b/.'},
      {id:'is2',text:'Which word starts like “moon”?',options:['milk','dog','fan','pen'],correct:0,explanation:'moon and milk start with /m/.'}
    ]},
    {id:'short-vowels',title:'Short vowels',gradeAnchor:'Grades 2–4',why:'Confusing short vowels causes reading and spelling errors.',miniLesson:'Listen to the middle sound in short CVC words such as cat, bed, sit, hot and sun.',treatmentSteps:['sort CVC words by vowel','read minimal pairs','spell 5 CVC words'],questions:[
      {id:'sv1',text:'Which word has the same middle sound as “cat”?',options:['map','pen','sit','dog'],correct:0,explanation:'cat and map have short /a/.'},
      {id:'sv2',text:'Which word has short /i/?',options:['sit','sun','hot','bed'],correct:0,explanation:'sit has the short /i/ sound.'}
    ]},
    {id:'blends-patterns',title:'Common blends and patterns',gradeAnchor:'Grades 3–5',why:'Needed for faster reading of longer words.',miniLesson:'Read familiar chunks such as sh, ch, th and common endings as one sound pattern.',treatmentSteps:['match digraphs to sounds','read 8 pattern words','use 3 words in sentences'],questions:[
      {id:'bp1',text:'Which word starts with “sh”?',options:['shop','chip','thin','stop'],correct:0,explanation:'shop begins with sh.'},
      {id:'bp2',text:'Which word starts with “ch”?',options:['chair','share','there','school'],correct:0,explanation:'chair begins with ch.'}
    ]}
  ]},
  {skillId:'english-vocabulary',subject:'English',title:'Core vocabulary map',subskills:[
    {id:'school-family',title:'School and family words',gradeAnchor:'Grades 2–4',why:'These high-frequency words appear in many reading texts.',miniLesson:'Learn words inside short sentences and pictures, not as isolated translations.',treatmentSteps:['10 picture-word matches','5 short sentences','quick recall after 5 minutes'],questions:[
      {id:'sf1',text:'Which word means «معلم»?',options:['teacher','doctor','driver','farmer'],correct:0,explanation:'teacher = معلم.'},
      {id:'sf2',text:'Which word means «أخت»?',options:['sister','brother','mother','uncle'],correct:0,explanation:'sister = أخت.'}
    ]},
    {id:'time-place',title:'Time and place words',gradeAnchor:'Grades 3–5',why:'Needed for schedules, directions and reading comprehension.',miniLesson:'Connect time and place words to real daily routines.',treatmentSteps:['days and times','place-word matching','two routine sentences'],questions:[
      {id:'tp1',text:'Which word means «غدًا»?',options:['tomorrow','yesterday','today','always'],correct:0,explanation:'tomorrow = غدًا.'},
      {id:'tp2',text:'Which word means «مستشفى»?',options:['hospital','school','market','park'],correct:0,explanation:'hospital = مستشفى.'}
    ]},
    {id:'actions-adjectives',title:'Action words and adjectives',gradeAnchor:'Grades 3–6',why:'Needed to build sentences and understand descriptions.',miniLesson:'Verbs show actions; adjectives describe people or things.',treatmentSteps:['sort verbs/adjectives','complete 5 sentences','write 3 short descriptions'],questions:[
      {id:'aa1',text:'Which word is a verb?',options:['run','happy','blue','small'],correct:0,explanation:'run is an action word.'},
      {id:'aa2',text:'Which word is an adjective?',options:['tall','write','jump','read'],correct:0,explanation:'tall describes a noun.'}
    ]}
  ]},
  {skillId:'english-sentence',subject:'English',title:'English grammar foundations',subskills:[
    {id:'basic-word-order',title:'Basic word order',gradeAnchor:'Grades 3–4',why:'All later tense structures depend on subject + verb order.',miniLesson:'A simple sentence often follows Subject + Verb + Object/Complement.',treatmentSteps:['reorder 5 sentences','identify subject and verb','write 3 simple sentences'],questions:[
      {id:'bwo1',text:'Choose the correct sentence.',options:['Maya reads books.','Reads Maya books.','Books Maya reads is.'],correct:0,explanation:'Subject + verb + object.'},
      {id:'bwo2',text:'Choose the correct sentence.',options:['They play football.','Play they football.','Football are they play.'],correct:0,explanation:'They + play + football.'}
    ]},
    {id:'be-do',title:'be / do / does',gradeAnchor:'Grades 4–5',why:'Needed for questions and negatives.',miniLesson:'Use am/is/are with be sentences. Use do/does to make many present-simple questions and negatives.',treatmentSteps:['choose am/is/are','choose do/does','build 4 questions'],questions:[
      {id:'bd1',text:'Choose: She ___ happy.',options:['is','do','does','are'],correct:0,explanation:'She is happy.'},
      {id:'bd2',text:'Choose: ___ he like football?',options:['Does','Do','Is','Are'],correct:0,explanation:'Does he like football?'}
    ]},
    {id:'present-simple',title:'Present simple',gradeAnchor:'Grades 4–5',why:'A core tense for routines and facts.',miniLesson:'Use the base verb with I/you/we/they. With he/she/it, the verb usually takes -s.',treatmentSteps:['subject-verb matching','affirmative and negative forms','routine sentences'],questions:[
      {id:'ps1',text:'Choose: He ___ to school every day.',options:['goes','go','going','went'],correct:0,explanation:'With he in present simple, go becomes goes.'},
      {id:'ps2',text:'Choose: They ___ football on Fridays.',options:['play','plays','played','playing'],correct:0,explanation:'They takes the base form play.'}
    ]},
    {id:'past-simple',title:'Past simple',gradeAnchor:'Grade 6',minCurrentGrade:7,why:'A common gap for Grade 7 reading and writing.',miniLesson:'Use the past form for finished actions in the past. Regular verbs often end in -ed; common irregular verbs have special forms.',treatmentSteps:['spot past-time markers','regular vs irregular verbs','write 4 past sentences'],questions:[
      {id:'pst1',text:'Choose: Yesterday, Lina ___ her grandmother.',options:['visited','visits','visit','visiting'],correct:0,explanation:'Yesterday signals a completed past action.'},
      {id:'pst2',text:'Choose the past of “go”.',options:['went','goed','goes','going'],correct:0,explanation:'go → went is irregular.'}
    ]},
    {id:'question-order',title:'Question order',gradeAnchor:'Grades 5–6',why:'Needed in speaking, comprehension and grammar tasks.',miniLesson:'Many questions follow Question word + auxiliary + subject + base verb.',treatmentSteps:['reorder questions','choose do/does/did','ask 5 real questions'],questions:[
      {id:'qo1',text:'Choose the correct question.',options:['Where do you live?','Where you do live?','Do where you live?'],correct:0,explanation:'Question word + do + subject + verb.'},
      {id:'qo2',text:'Choose the correct past question.',options:['Where did she go?','Where she did go?','Where did she went?'],correct:0,explanation:'After did, use the base verb go.'}
    ]}
  ]},
  {skillId:'english-reading',subject:'English',title:'English reading comprehension',subskills:[
    {id:'reading-detail',title:'Find stated details',gradeAnchor:'Grades 3–4',why:'This is the first step before inference.',miniLesson:'Read the question, scan for the key word, then find the sentence with the answer.',treatmentSteps:['scan 3 short texts','underline evidence','answer without translating every word'],questions:[
      {id:'rd1',text:'Text: “Omar gets up at 6:30 and walks to school.” How does Omar go to school?',options:['He walks.','By bus.','By car.','By bike.'],correct:0,explanation:'The text says he walks to school.'},
      {id:'rd2',text:'Text: “Sara has two cats and one bird.” How many cats does Sara have?',options:['Two','One','Three','Four'],correct:0,explanation:'The detail is stated directly.'}
    ]},
    {id:'reading-main-idea-en',title:'Main idea',gradeAnchor:'Grades 4–6',why:'Needed for longer Grade 7 texts.',miniLesson:'Ask what most sentences are about, then choose the option that covers the whole text.',treatmentSteps:['identify repeated topic','reject small details','choose a short title'],questions:[
      {id:'rmi1',text:'Text: “Our class planted trees. We water them every week. They make the school yard greener.” Best main idea?',options:['Taking care of school trees','Buying new books','Playing football','Learning maths'],correct:0,explanation:'All sentences are about planting and caring for trees.'},
      {id:'rmi2',text:'A paragraph explains sleep, healthy food and exercise. Best title?',options:['Healthy habits','My new phone','A rainy day','School subjects'],correct:0,explanation:'The ideas are all healthy habits.'}
    ]},
    {id:'pronoun-reference',title:'Pronoun reference',gradeAnchor:'Grades 5–6',why:'Pronoun confusion can break understanding across sentences.',miniLesson:'Look for the nearest noun that matches the pronoun in meaning and number.',treatmentSteps:['match he/she/it/they','trace pronouns in 4 sentences','replace pronoun with noun'],questions:[
      {id:'prf1',text:'“Mona bought a book. She read it at night.” Who is “She”?',options:['Mona','the book','night','a shop'],correct:0,explanation:'She refers to Mona.'},
      {id:'prf2',text:'“The boys found the balls. They put them in a box.” “They” refers to:',options:['the boys','the balls','the box'],correct:0,explanation:'They refers to the boys.'}
    ]},
    {id:'reading-inference-en',title:'Simple inference',gradeAnchor:'Grade 6',minCurrentGrade:7,why:'Grade 7 texts often require meaning beyond a copied sentence.',miniLesson:'Combine two clues from the text to make a supported conclusion.',treatmentSteps:['find two clues','choose a supported inference','explain the evidence'],questions:[
      {id:'rie1',text:'“Rami took an umbrella. Dark clouds covered the sky.” What is likely?',options:['It may rain.','It is very hot and sunny.','He is going swimming.','It is midnight.'],correct:0,explanation:'Umbrella + dark clouds support the rain inference.'},
      {id:'rie2',text:'“Nour studied every evening. She smiled when she saw her test result.” What is likely?',options:['She did well.','She lost the test.','She never studied.','The test was cancelled.'],correct:0,explanation:'Studying and smiling at the result support a positive outcome.'}
    ]}
  ]}
];

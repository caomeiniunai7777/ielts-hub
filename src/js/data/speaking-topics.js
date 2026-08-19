/* ========================================
   IELTS Hub — Speaking Topics (当季题库)
   Part 1 / Part 2 & 3 seasonal topic bank
   ======================================== */

const SpeakingTopics = {
  part1: [
    { id: 'p1-01', topic: 'Work or Study', cat: '事物', q: ['Do you work or are you a student?', 'What do you like most about your study/work?', 'Is there anything you dislike about it?'] },
    { id: 'p1-02', topic: 'Hometown', cat: '地点', q: ['Where is your hometown?', 'Is there anything you like about your hometown?', 'Would you say it\'s a good place to live in?'] },
    { id: 'p1-03', topic: 'Home/Accommodation', cat: '地点', q: ['Do you live in a house or a flat?', 'What\'s your favorite room?', 'What would you change about your home?'] },
    { id: 'p1-04', topic: 'Weather', cat: '事物', q: ['What\'s the weather like in your city?', 'Do you like hot or cold weather?', 'Does weather affect your mood?'] },
    { id: 'p1-05', topic: 'Music', cat: '事物', q: ['Do you like listening to music?', 'What kind of music do you like?', 'Do you play any musical instruments?'] },
    { id: 'p1-06', topic: 'Reading', cat: '事物', q: ['Do you like reading?', 'What kind of books do you read?', 'Do you prefer e-books or paper books?'] },
    { id: 'p1-07', topic: 'Sports', cat: '事件', q: ['Do you like sports?', 'What sports do you usually do?', 'Do you prefer watching or playing sports?'] },
    { id: 'p1-08', topic: 'Travel', cat: '事件', q: ['Do you like travelling?', 'Where would you like to travel to?', 'Do you prefer travelling alone or with others?'] },
    { id: 'p1-09', topic: 'Cooking', cat: '事件', q: ['Can you cook?', 'Do you prefer eating out or cooking at home?', 'What\'s your favorite dish to cook?'] },
    { id: 'p1-10', topic: 'Friends', cat: '人物', q: ['Do you have many friends?', 'What do you usually do with your friends?', 'Do you prefer spending time alone or with friends?'] },
    { id: 'p1-11', topic: 'Animals/Pets', cat: '事物', q: ['Do you like animals?', 'Have you ever had a pet?', 'What\'s your favorite animal?'] },
    { id: 'p1-12', topic: 'Art', cat: '事物', q: ['Do you like art?', 'Do you visit art galleries?', 'Can you draw or paint?'] },
  ],

  part2: [
    { id: 'p2-01', topic: 'A person who inspired you', cat: '人物', cue: 'Describe a person who has inspired you. You should say: who this person is, how you know them, what they did to inspire you, and explain why you found them inspiring.' },
    { id: 'p2-02', topic: 'A place you visited', cat: '地点', cue: 'Describe a place you visited that you found interesting. You should say: where it was, when you went there, what you did there, and explain why you found it interesting.' },
    { id: 'p2-03', topic: 'A book you enjoyed', cat: '事物', cue: 'Describe a book you read that you enjoyed. You should say: what the book was about, when you read it, why you read it, and explain why you enjoyed it.' },
    { id: 'p2-04', topic: 'A skill you learned', cat: '事件', cue: 'Describe a skill you learned that was useful. You should say: what the skill was, how you learned it, why it was useful, and explain how you use it now.' },
    { id: 'p2-05', topic: 'A time you helped someone', cat: '事件', cue: 'Describe a time when you helped someone. You should say: who you helped, how you helped them, why you helped them, and explain how you felt about it.' },
    { id: 'p2-06', topic: 'A goal you achieved', cat: '事件', cue: 'Describe a goal you set and achieved. You should say: what the goal was, when you set it, how you achieved it, and explain how you felt when you achieved it.' },
    { id: 'p2-07', topic: 'An interesting conversation', cat: '事件', cue: 'Describe an interesting conversation you had. You should say: who you had it with, when and where it happened, what you talked about, and explain why it was interesting.' },
    { id: 'p2-08', topic: 'A person you admire', cat: '人物', cue: 'Describe a person you admire. You should say: who they are, how you know about them, what they have achieved, and explain why you admire them.' },
  ],

  part3: [
    { id: 'p3-01', topic: 'Role models', cat: '人物', q: ['What qualities should a role model have?', 'Are celebrities good role models?', 'How can parents be positive role models?'] },
    { id: 'p3-02', topic: 'Tourism', cat: '地点', q: ['How has tourism changed in your country?', 'What are the negative effects of tourism?', 'Should governments restrict tourism?'] },
    { id: 'p3-03', topic: 'Education', cat: '事物', q: ['Has education improved in recent years?', 'Should education be free for everyone?', 'How might technology change education?'] },
    { id: 'p3-04', topic: 'Skills', cat: '事件', q: ['What skills are most useful in modern society?', 'Are practical skills more important than academic ones?', 'How should schools teach life skills?'] },
  ],

  // AI examiner accents
  accents: [
    { key: 'en-GB', label: '英音考官', flag: 'British RP', lang: 'en-GB' },
    { key: 'en-AU', label: '澳音考官', flag: 'Australian',  lang: 'en-AU' },
    { key: 'en-US', label: '美音考官', flag: 'American',   lang: 'en-US' },
    { key: 'en-IN', label: '印度考官', flag: 'Indian',     lang: 'en-IN' },
  ],

  filterByCat(list, cat) {
    if (!cat || cat === '全部') return list;
    return list.filter(t => t.cat === cat);
  },
};

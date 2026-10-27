export const LEVELS = {'3-5':'Little explorer','6-8':'Explorer','9-12':'Big explorer'};
const words = (little, middle, big) => ({'3-5':little,'6-8':middle,'9-12':big});
const puzzle = (prompt, a, op, b, choices, hint, why) => ({prompt,a,op,b,choices,hint,why});
export const PLANETS = ['Mercury','Venus','Earth','Mars','Jupiter','Saturn','Uranus','Neptune'];
export function planetPuzzle(level) {
  const expected=PLANETS.slice(0,level==='3-5'?4:8);
  return {kind:'planet-order',expected,choices:['Saturn','Earth','Neptune','Mars','Jupiter','Venus','Uranus','Mercury'].filter(p=>expected.includes(p)),
    prompt:level==='3-5'?'Tap the first four planets in order, starting nearest the Sun. The little map can help.':'Tap all eight planets in order, starting nearest the Sun.',
    hint:'Follow this order from the Sun: '+expected.join(' → ')+'.',why:level==='3-5'?'You did it! Mercury, Venus, Earth, Mars—the first four planets from the Sun.':'Your planet map is complete! All eight planets are in order from the Sun.'};
}
export function planetOrderResult(expected,selected) {
  const firstMismatch=selected.findIndex((name,i)=>name!==expected[i]);
  const complete=selected.length===expected.length;
  return {complete,correct:complete&&firstMismatch===-1,firstMismatch};
}

export const STORIES = [
  {
    id:'planets',world:'Around the Solar System',title:'Nia and the Planet Parade',icon:'☀',theme:'planets',
    blurb:'Help Nia put her planet map in order, from little Mercury to faraway Neptune.',skills:'Planet order · Observation · Curiosity',
    openingTitle:'The mixed-up planet map',opening:words(
      'Nia made a rocket from a cardboard box. Her toy robot, Orbit, held a planet map. Whoops! The planet cards fell down. “Let’s put them back,” said Nia. Their pretend space trip was ready to begin.',
      'Nia’s cardboard rocket was ready for its first imaginary journey. Her co-pilot, a toy robot called Orbit, carried a map of the Solar System. Then a sneeze sent the planet cards flying. Saturn landed in a slipper. Earth slid under a cushion. “We need a map, not a planet jumble,” Nia laughed. First they would look for clues.',
      'Nia had built an observatory from a blanket, two chairs, and a cardboard control panel. Orbit, her toy robot, was in charge of a map showing the eight planets in order from the Sun. Unfortunately, he was also in charge of balancing a very wobbly stack of books. One spectacular tumble later, the planet cards were scattered across the floor. Nia decided to rebuild the map by noticing how the worlds were different. Their spaceship was imaginary; the planet names were real.'
    ),question:'Which clues should Nia explore first?',
    routes:[
      {label:'Meet the rocky planets',detail:'Look at Mercury, Venus, Earth, and Mars.',title:'Four rocky neighbors',text:words(
        'Mercury came first, near the Sun. Then came Venus. Earth was third—that was home! Mars came next. Nia held the four cards carefully. Could you help put them in order?',
        'Nia and Orbit began with Mercury, the planet nearest the Sun. Venus came next, followed by Earth and then Mars. These four inner planets have rocky surfaces. Nia drew a little house beside Earth on the map. “That’s where our adventure began,” she said. Now it was time to arrange the cards.',
        'Orbit found the Mercury card beside the cardboard controls. Nia placed it nearest the Sun, followed by Venus, Earth, and Mars. These inner planets have solid, rocky surfaces. They were not four copies of the same world, but a family of very different neighbors. Nia marked Earth as home and checked the order once more before rebuilding the whole map.'
      )},
      {label:'Look for the giant planets',detail:'Find Jupiter, Saturn, Uranus, and Neptune.',title:'The giants farther out',text:words(
        'Jupiter was the biggest planet. Saturn had beautiful rings. Uranus and Neptune were farther out. “We need the little planets too!” said Orbit. Nia spread out the cards. Let’s start near the Sun.',
        'Farther from the Sun were Jupiter, Saturn, Uranus, and Neptune. Jupiter was the largest planet, while Saturn’s rings made Nia think of a very grand hat. Uranus and Neptune belonged beyond them on the map. “Biggest doesn’t mean first,” Nia told Orbit. They would sort by distance from the Sun, not by size.',
        'Nia found Jupiter, the largest planet, and Saturn with its striking rings. Beyond them belonged Uranus and Neptune, the two ice giants. Orbit tried putting the biggest card first. “That would sort by size,” Nia explained. “Our map sorts by distance from the Sun.” Choosing a rule mattered: the same collection could be arranged in several ways, but only one would answer their question.'
      )}
    ],puzzleTitle:'Put the planets in order',puzzles:{'3-5':planetPuzzle('3-5'),'6-8':planetPuzzle('6-8'),'9-12':planetPuzzle('9-12')},
    bridgeTitle:'A place for every planet',bridge:words(
      'The first four were Mercury, Venus, Earth, and Mars. After them came Jupiter, Saturn, Uranus, and Neptune. Eight planets! Nia smiled at the map. What could she make to remember their names?',
      'The map now led from Mercury to Venus, Earth, Mars, Jupiter, Saturn, Uranus, and Neptune. Eight different worlds, all traveling around the Sun. Nia knew her cards did not show the real sizes or the huge spaces between planets. They helped her remember the order. Now she wanted to share what she had learned.',
      'Mercury, Venus, Earth, Mars, Jupiter, Saturn, Uranus, Neptune: the map had its order again. Nia wrote a note at the bottom: “Not to scale.” The cards could not show both the planets and the enormous distances between them accurately. Nor were the planets standing still in a straight line. A useful map did not have to show everything, but it should say what it was showing. What would Nia make from it?'
    ),endingQuestion:'How should Nia share her discovery?',endings:[
      {label:'Make a planet passport',detail:'Give every planet its own little page.',title:'Eight pages of wonder',text:words(
        'Nia made a little book. Each planet got a page. Earth got a heart. Orbit got to hold the book. Their pretend rocket came home, ready for another story.',
        'Nia folded a planet passport with a page for every world. On Earth’s page she drew a heart. On the last page she wrote a question she wanted to explore tomorrow. Orbit stamped the cover with a cardboard star. The adventure ended at home, but the wondering had only begun.',
        'Nia made a passport of questions rather than pretending she knew everything. Each planet received a page, a name, and something she wanted to investigate next. Earth’s page had an extra line: “The place we can care for today.” Orbit added an enormous star to the cover. It was a good record of a journey that had traveled farther in curiosity than in kilometers.'
      )},
      {label:'Build a tabletop parade',detail:'Turn the planet cards into a display.',title:'A Solar System on the table',text:words(
        'Nia lined up her cards. She pointed to each planet and said its name. Orbit bowed to the little audience of toys. The planet parade was ready. Everyone cheered for Earth, their home!',
        'Nia arranged the planet cards across the table and invited her toys to a parade. She read every name from the Sun outward. A small sign explained that the sizes and spaces were pretend. Then she pointed to Earth. “And here,” she said, “is where our next real adventure starts.”',
        'Nia built a tabletop parade and made a label: “Order from the Sun; sizes and distances not to scale.” When her audience of toys arrived, she explained why Jupiter could be the largest without being first. Orbit gave the demonstration a solemn beep of approval. The best part was not simply knowing eight names. It was being able to explain the rule connecting them.'
      )}
    ],activity:'Draw planet cards and put them in order from the Sun. Try the first four, or all eight. Label your picture “not to scale”—the real sizes and distances are very different.',reflect:'Which planet would you like to learn more about, and what would you ask?'
  },
  {
    id:'space', world:'Among the stars', title:'The Moonlight Post Office', icon:'✦', theme:'space',
    blurb:'One small robot. One very important letter. A delivery across the stars.',
    skills:'Kindness · Number skills · Imagination',
    openingTitle:'A letter with no address',
    opening:words(
      'Pip the robot found a letter. It said, “For someone who feels lonely.” Pip packed it in a little rocket. Who could help find its new friend?',
      'Pip was the smallest robot at the Moonlight Post Office. One evening, a silver envelope slipped from the sorting machine. It had no address, only these words: “For someone who feels lonely.” Pip tucked it into a pocket and climbed into a little rocket. This delivery would need more than a map.',
      'At the Moonlight Post Office, every letter normally arrived with a planet, a street, and a tidy postal code. This one had none. “For someone who feels lonely,” said the envelope. Pip, a delivery robot with one squeaky wheel, turned it over twice. The sorting machine stamped it UNDELIVERABLE. Pip quietly crossed out the stamp. Perhaps the machine was answering the wrong question. Where should a letter like this go?'
    ),
    question:'Where should Pip look first?',
    routes:[
      {label:'Visit the quiet moon', detail:'Look for someone who needs company.', title:'A light in the window', text:words(
        'On the pretend moon, a little gardener waved. “I wish someone would visit,” she said. Pip had found the right friend! They packed little lights for her garden.',
        'Pip landed beside a tiny moon garden. Its gardener, Luna, had set two cups on her table even though no visitor had come. “I keep hoping,” she said. Pip knew where the letter belonged. Before opening it, they gathered little lanterns to brighten the garden.',
        'Beyond the busy landing pads stood a moon garden with a single lit window. Luna, its gardener, watered silver paper flowers. “I write postcards,” she admitted, “but I never know who would like one.” Pip showed her the envelope. Luna smiled before she even opened it. Together they unpacked lanterns for a garden where visitors might feel welcome.'
      )},
      {label:'Ask at the comet café', detail:'Listen to the travelers passing through.', title:'The table for one', text:words(
        'At the pretend comet café, a traveler sat alone. His name was Sol. “May I sit here?” asked Pip. Sol smiled. They packed little lights for his window.',
        'At the comet café, everyone seemed busy except Sol, a traveler drawing pictures on a napkin. He had visited many places but had nobody to tell about them. Pip pulled up a chair. “I think this letter is for you.” They gathered lanterns for Sol’s little ship.',
        'The comet café was crowded, yet one table felt very far from the others. Sol, a mapmaker, sat there with a notebook full of extraordinary places. “People ask where I have been,” he told Pip, “but seldom what I noticed.” Pip asked about his favorite drawing and listened to the whole answer. Then they chose lanterns to make Sol’s ship a welcoming place for stories.'
      )}
    ],
    puzzleTitle:'Pack the little lanterns', object:'🏮', puzzles:{
      '3-5':puzzle('Pip packs 2 lanterns, then 2 more. How many lanterns?',2,'+',2,[3,4,5],'Count four little lights: one, two, three, four.','2 + 2 = 4. Four lanterns are ready!'),
      '6-8':puzzle('Pip packs 6 lanterns, then 5 more. How many altogether?',6,'+',5,[10,12,11],'Start at 6. Count on five more.','6 + 5 = 11. Eleven lanterns are ready!'),
      '9-12':puzzle('Pip packs 4 boxes with 3 lanterns in each. How many lanterns?',4,'×',3,[7,12,16],'Add four groups of 3: 3 + 3 + 3 + 3.','4 × 3 = 12. Twelve lanterns are ready!')
    },
    bridgeTitle:'The words inside', bridge:words(
      'The letter said, “There is a place for you.” Pip’s new friend smiled. What could they do next?',
      'Inside the envelope was a picture of two chairs and a message: “There is a place for you.” Pip’s new friend put the letter where it could be seen every day. But Pip wanted the kindness to keep traveling.',
      'The envelope held no magnificent invitation, only a drawing of two chairs. Underneath, someone had written, “There is a place for you.” Pip realized that the delivery was not finished when the letter arrived. It was finished when somebody felt included. Now they had a chance to send that feeling onward.'
    ),
    endingQuestion:'How will they share the kindness?',
    endings:[
      {label:'Write a letter together', detail:'Send a little welcome to someone new.', title:'Kindness, special delivery', text:words(
        'They drew two friends and a big heart. Pip carried the new letter away. Now another friend would have a happy surprise. The little rocket went home with a very big smile.',
        'Together they wrote, “Would you like to share a story?” and tucked a drawing inside. Pip carried the new letter to another quiet doorway. By bedtime, two lonely windows had become two places waiting for a friend. The smallest delivery robot had started something wonderfully big.',
        'They wrote a new letter without promising that every day would be easy. “I would like to hear your story,” it said. This time Pip knew exactly where to begin: with someone who had not been asked. Back at the post office, the sorting machine requested a delivery category. Pip typed CONNECTION and listened to the pleased little ding.'
      )},
      {label:'Make a welcome light', detail:'Invite a visitor to sit and share a story.', title:'A place at the table', text:words(
        'They hung a light by the door. Soon a visitor came. Pip made room for one more chair. The letter had helped three friends find each other.',
        'They placed a lantern in the window and a sign outside: “Stories welcome.” A passing traveler stopped. Pip found another chair, and soon everyone was laughing about a suitcase full of odd socks. The letter stayed on the table, right beside the extra cup.',
        'They hung a lantern beside a handwritten sign: “Come tell us something you noticed.” The first visitor described a beautiful crack in an ordinary pavement. The second brought a joke that needed some work. Nobody minded. Pip returned home knowing that a welcome did not have to be grand. Sometimes it was simply a light, a chair, and time to listen.'
      )}
    ],
    activity:'Design a postcard for an imaginary planet. Draw a welcoming place on one side and write or say a kind message for someone you know.',
    reflect:'What could you do to help someone feel included?'
  },
  {
    id:'forest',world:'Through the woodland',title:'The Forest of Lost Sounds',icon:'❧',theme:'forest',
    blurb:'Help a fox and a tiny owl find the sound missing from their forest.',skills:'Listening · Patterns · Teamwork',
    openingTitle:'Something was missing',
    opening:words(
      'Fern the fox woke up. The leaves went rustle. The stream went splash. But where was Owl’s song? Fern went to look with soft, quiet steps.',
      'Fern the fox knew the forest’s morning song: rustling leaves, a splashing stream, and a tiny owl’s last hoot before bedtime. Today the hoot was missing. Fern picked up a notebook and went to look. A friend’s silence was worth noticing.',
      'Fern collected sounds the way other foxes collected shiny pebbles. In her notebook, rain was written as “a thousand tiny footsteps,” and the stream as “someone laughing around a corner.” This morning, something was absent. The little owl who sang from the old oak had made no sound at all. Fern closed her notebook. Before inventing an explanation, she would listen.'
    ),
    question:'Which clue should Fern follow?',
    routes:[
      {label:'Listen by the stream',detail:'Follow a soft tap-tap-tap.',title:'A very small rehearsal',text:words(
        'Tap, tap! Owl sat by the stream. “My new song feels too big,” he said. Fern sat beside him. They chose leaves to make a gentle beat.',
        'Beside the stream, Owl tapped a stone with a twig. He had written a new song but worried that everybody would laugh. Fern did not tell him to hurry. “We can practice quietly,” she said. They collected leaves to mark out a steady rhythm.',
        'The tapping came from a flat stone beside the water. Owl was rehearsing a new song, stopping whenever a note surprised him. “The old song was easy because everyone already knew it,” he said. Fern listened without correcting a single note. Then she suggested a steady beat, something simple to lean on while the melody found its feet.'
      )},
      {label:'Look beside the old oak',detail:'Find the owner of a little feather.',title:'The song in the branches',text:words(
        'Owl sat low in the oak. “I forgot my song,” he said. Fern hummed one little note. Owl hummed back. They chose leaves to make a gentle beat.',
        'Owl sat on a low branch with one wing over his beak. He had forgotten the middle of his song. “Start with the bit you remember,” Fern suggested. One note became two. They collected leaves to help them keep a steady rhythm.',
        'A small feather pointed toward the old oak. Owl sat on its lowest branch, embarrassed by a gap in his memory. Fern asked him to sing only the beginning. Then she hummed it back. Hearing someone else carry those notes made the next ones easier to find. Together they collected leaves for a simple rhythm, leaving space for pauses as well as sounds.'
      )}
    ],
    puzzleTitle:'Build a leafy rhythm',object:'🍃',puzzles:{
      '3-5':puzzle('Fern lays down 1 leaf, then 2 more. How many leaves?',1,'+',2,[2,4,3],'One leaf, then two more: one, two, three.','1 + 2 = 3. Three leaves make a little beat.'),
      '6-8':puzzle('Fern has 9 leaves. She puts 3 away. How many are left?',9,'−',3,[5,6,7],'Count back three from 9: 8, 7, 6.','9 − 3 = 6. Six leaves are left for the rhythm.'),
      '9-12':puzzle('Share 18 leaves equally between 3 rhythm circles. How many in each?',18,'÷',3,[5,9,6],'Find the number that makes 3 equal groups total 18.','18 ÷ 3 = 6. Each circle gets six leaves.')
    },
    bridgeTitle:'Room for a quiet voice',bridge:words(
      'Owl sang one note. Then two! Fern smiled. “We can go slowly,” she said. How should they finish the song?',
      'With the leafy rhythm to help him, Owl sang the whole little tune. A wrong note slipped in, and the sky did not fall. Fern smiled. Owl was ready to choose how he wanted to share his song.',
      'The rhythm steadied Owl, but the important part was that Fern stayed. One note wobbled; another came out much louder than expected. Neither ended the song. Owl discovered that a pause could be part of the music, rather than evidence that he had failed. Now he could decide how much of his new courage to share.'
    ),
    endingQuestion:'What would feel right for Owl?',
    endings:[
      {label:'Sing for a few friends',detail:'Make a small, friendly forest concert.',title:'The smallest concert',text:words(
        'Two rabbits came to listen. Owl sang. Fern tapped the beat. Everyone clapped softly. The forest had its song again.',
        'Fern invited two rabbits and a hedgehog. Nobody demanded a perfect song. Owl sang, the leaves kept time, and the audience clapped softly. It was the smallest concert in the forest, and exactly the right size.',
        'Their audience was three friends on a fallen log. Owl sang with one wobble and two beautiful pauses. Afterwards, the hedgehog said which part she liked, and the rabbits asked to hear the beginning again. Fern wrote a new sound in her notebook: “Courage, when it is quiet.”'
      )},
      {label:'Keep practicing together',detail:'Let the big performance wait.',title:'A song for two',text:words(
        'Owl and Fern sang just for each other. They made a funny new ending. Owl felt happy. A quiet song could be special too.',
        'Owl chose another practice instead of a concert. Fern stayed. They invented a silly ending and laughed so much that a squirrel looked down to see why. A song shared with one good friend was already a song worth singing.',
        'Owl decided he was not ready for an audience. Fern put away the invitations she had almost imagined. They practiced, changed the ending, and enjoyed the sound without turning it into a performance. In her notebook Fern wrote: “Listening also means hearing when a friend says, not yet.”'
      )}
    ],
    activity:'With a grown-up, listen for three everyday sounds. Draw a symbol for each, then tap a gentle rhythm on your knees.',reflect:'How can you help a friend try something at their own pace?'
  },
  {
    id:'dinosaurs',world:'In a dinosaur valley',title:'The Great Dino Picnic',icon:'▲',theme:'dinosaurs',
    blurb:'A tiny dinosaur has a big idea: a picnic where everyone belongs.',skills:'Problem solving · Sharing · Number skills',
    openingTitle:'One very long picnic blanket',opening:words(
      'Dot was a little dinosaur with a big blanket. “Let’s have a picnic!” she said. Her friends were big and small. Where could they all sit?',
      'In a make-believe dinosaur valley, Dot had a brilliant picnic plan. She packed fruit, folded a blanket, and invited every friend she knew. Then she noticed a problem: some friends were as small as bushes, and others were taller than trees. One ordinary picnic spot would not do.',
      'Dot had drawn a perfect picnic in her notebook. There were neat plates, straight rows, and a blanket with no wrinkles. Then her friends arrived: tall, short, wide, narrow, and one who preferred a great deal of personal space. Dot looked from the picture to the real gathering. Perhaps a good plan was something that could change.'
    ),question:'Where should Dot make room?',
    routes:[
      {label:'Try the wide meadow',detail:'Spread out with plenty of space.',title:'A blanket that could grow',text:words(
        'The meadow was wide. Dot added little blankets beside the big one. Now everyone had room! She brought out the picnic baskets.',
        'The meadow had plenty of space but only one blanket. Dot’s friends brought little mats and joined them together. Soon the picnic curved like a friendly river. Dot set out the baskets so every guest could reach one.',
        'In the meadow, Dot discovered that a single perfect rectangle was not necessary. Friends added mats, leaves, and cushions, leaving wider gaps where they were needed. The picnic became a collection of comfortable little places joined by conversation. Dot began arranging baskets within everyone’s reach.'
      )},
      {label:'Try the shady grove',detail:'Find cool spots beneath the leaves.',title:'Different places, one picnic',text:words(
        'The grove was shady. Some friends sat under trees. Tall friends sat beside them. Dot made a circle. She brought out the picnic baskets.',
        'The grove was cool, but the tallest friends could not fit under its branches. Dot made a circle around the trees instead. Short friends sat inside the shade; tall friends rested at the edge. Everyone could see a friendly face.',
        'The grove seemed ideal until the tallest guests ducked beneath its branches. Dot asked where each friend would feel comfortable instead of deciding for them. Their circle grew around the trees, with open spaces at its edges. The result looked nothing like her drawing. It worked much better.'
      )}
    ],
    puzzleTitle:'Get the picnic ready',object:'🧺',puzzles:{
      '3-5':puzzle('There are 4 baskets. Dot carries 1 to the blanket. How many stay here?',4,'−',1,[2,3,4],'Start with four. Move one away. Count the three still here.','4 − 1 = 3. Three baskets are waiting.'),
      '6-8':puzzle('One basket has 7 apples. Another has 6. How many apples altogether?',7,'+',6,[12,14,13],'Start with 7 and add 6. You can make 10 first, then add 3.','7 + 6 = 13. Thirteen apples are ready.'),
      '9-12':puzzle('There are 4 picnic tables with 4 plates on each. How many plates?',4,'×',4,[8,16,20],'Count four groups of four.','4 × 4 = 16. Sixteen plates are ready.')
    },
    bridgeTitle:'The guest at the edge',bridge:words(
      'A shy dinosaur stood nearby. “Can I join?” he asked. “Yes!” said Dot. What could help him feel welcome?',
      'Just as the picnic began, a new dinosaur appeared at the edge. He did not know anybody and held a tiny empty plate. Dot waved him closer. Finding enough room had been the first part. Making someone feel welcome was the next.',
      'When the baskets were ready, Dot noticed a guest standing beyond the circle. He was not the largest dinosaur or the smallest. He simply knew nobody. A space on the blanket would not, by itself, solve that problem. Dot remembered how helpful it had been to ask her friends what they needed.'
    ),endingQuestion:'How should Dot welcome the new friend?',
    endings:[
      {label:'Offer a place beside Dot',detail:'Start with a friendly conversation.',title:'One more place',text:words(
        'Dot made room beside her. They talked about funny clouds. Soon the new friend was laughing. The best part of the picnic was sharing it.',
        'Dot offered the place beside her and asked about his favorite game. Soon two other friends joined the conversation. The picnic had room for one more dinosaur and a whole collection of new ideas. Dot’s blanket was not perfect. Her afternoon was lovely.',
        'Dot offered a seat and asked a question without rushing the answer. The new guest told her about a game he loved. Soon a small group was listening. That evening, Dot changed the title of her notebook drawing from “The Perfect Picnic” to “A Picnic We Made Together.”'
      )},
      {label:'Invite him to choose a game',detail:'Ask what he would enjoy playing.',title:'The cloud-shaped game',text:words(
        '“I like cloud games,” said the new friend. They looked up together. One cloud looked like a sock! Everyone laughed and wanted another turn.',
        'Dot asked what he would enjoy. “Cloud guessing,” he said quietly. Soon the whole circle was spotting cloud socks, cloud sandwiches, and a cloud that looked suspiciously like Dot. The new friend had brought something wonderful without needing a full basket.',
        'Rather than assigning him a job, Dot asked if he would like to suggest a game. He chose cloud guessing. The first cloud resembled a rather worried potato; the next prompted six different answers. There was no winning answer to defend. The guest at the edge became the person who helped everybody look up.'
      )}
    ],activity:'Design a pretend picnic for three very different toy guests. Draw a comfortable place for each and count the plates you need.',reflect:'What could you change in a plan so another person can join in?'
  },
  {
    id:'castle',world:'Beyond the castle gate',title:'The Dragon Who Lost His Roar',icon:'♜',theme:'castle',
    blurb:'A gentle dragon discovers that a quiet talent can be a wonderful one.',skills:'Creativity · Confidence · Number skills',
    openingTitle:'A very unexpected squeak',opening:words(
      'Bram the dragon opened his mouth. “Squeak!” His big roar was gone. Today was the castle party. Mina the mouse said, “Let’s find a new way to help.”',
      'Bram’s job was to open the castle festival with a magnificent roar. But this morning, only a squeak came out. He hid behind a tower. Mina the mouse found him there. “A festival needs more than noise,” she said. “Let’s discover what else you can do.”',
      'For years, the castle festival had begun with Bram’s roar. It rattled the bunting and made the mayor drop his hat. This year, Bram opened his mouth and produced a squeak so small that a butterfly failed to notice. Bram was sure he had ruined everything. Mina the mouse disagreed. “You are treating one missing talent as though it were your whole self,” she said. “Shall we investigate?”'
    ),question:'Where should Bram and Mina look for an idea?',
    routes:[
      {label:'Visit the lantern workshop',detail:'Try making something with gentle hands.',title:'A dragon with delicate claws',text:words(
        'Bram folded paper with his claws. He made a little lantern! Mina made one too. They needed more lanterns for the party.',
        'At the workshop, Bram expected to tear the paper with his claws. Instead, he folded it carefully into a beautiful lantern. Mina made a smaller one. The workshop keeper smiled. “Those gentle hands could help light the whole courtyard.”',
        'Bram’s claws looked enormous beside a square of paper. He worked slowly, following Mina’s folds. The resulting lantern leaned slightly to the left, which Mina declared charming. The workshop keeper asked if they would help decorate the courtyard. Bram had arrived looking for a replacement roar. He found a task that required patience instead.'
      )},
      {label:'Visit the castle library',detail:'Look for a story worth sharing.',title:'The quietest storyteller',text:words(
        'Bram found a picture book. He read it in a quiet voice. Mina came closer to hear. “Let’s read at the party!” she said. They needed lanterns for the story corner.',
        'In the library, Bram read a story in his tiny voice. Mina moved closer. So did the librarian. Before long, three mice were listening beside his tail. “You don’t have to shout to tell a wonderful story,” Mina said. They chose lanterns for a cozy reading corner.',
        'The library had a book about a giant who was afraid of small mistakes. Bram read a page aloud. His quiet voice made Mina lean closer, and the librarian stopped shelving books to listen. By the last page, Bram had forgotten to worry about his roar. They decided that the festival could use a place where people were invited to listen, not startled into it.'
      )}
    ],puzzleTitle:'Light the storybook courtyard',object:'🏮',puzzles:{
      '3-5':puzzle('Mina hangs 3 lanterns, then 1 more. How many lanterns?',3,'+',1,[3,5,4],'Three lanterns and one more make four.','3 + 1 = 4. Four lights for the party!'),
      '6-8':puzzle('There are 12 lanterns. Mina hangs 4. How many still need hanging?',12,'−',4,[7,8,9],'Take 2 away to reach 10, then take 2 more away.','12 − 4 = 8. Eight lanterns still need hanging.'),
      '9-12':puzzle('Share 24 lanterns equally across 4 courtyard walls. How many per wall?',24,'÷',4,[4,8,6],'What number multiplied by 4 makes 24?','24 ÷ 4 = 6. Six lanterns go on each wall.')
    },bridgeTitle:'The festival begins',bridge:words(
      'The lanterns glowed. Bram still had a small voice. Mina held his claw. “You can help just as you are.” What should he try?',
      'The courtyard filled with warm lantern light. Bram tried his roar once more. Still a squeak. Mina squeezed his claw. The festival did not need him to become loud again before he could belong. It needed one of the things he could do today.',
      'The mayor approached, hat held firmly in both hands. Bram explained about the squeak. For a moment, everyone considered the unfamiliar possibility of a festival that began quietly. Then Mina pointed to the lanterns. “We already have something worth gathering around.” Bram was allowed to choose how he would take part.'
    ),endingQuestion:'How should Bram open the festival?',endings:[
      {label:'Lead a lantern parade',detail:'Let the lights do the talking.',title:'A glow instead of a roar',text:words(
        'Bram held up a lantern. His friends followed. The castle glowed. His tiny squeak made Mina smile. He was still their wonderful dragon.',
        'Bram lifted the first lantern and led a slow parade around the courtyard. Little lights followed big ones. Nobody dropped a hat, but everybody smiled. Bram discovered that he could make a celebration glow without making a single loud sound.',
        'The parade began with a raised lantern. People noticed it, then noticed one another. The quiet opening left room for footsteps, laughter, and a child describing the colors. Bram’s roar had not returned by bedtime. His sense of belonging had. Mina called that a very successful festival.'
      )},
      {label:'Tell a quiet story',detail:'Invite everyone to gather close.',title:'The circle of listeners',text:words(
        'Bram told a little story. Everyone sat close. Even the king listened. “Another story, please!” said Mina. Bram smiled his biggest smile.',
        'Bram sat beneath the lanterns and told a story about a mouse who helped a dragon. The crowd gathered close enough to hear. When he finished, nobody asked for a roar. They asked for another story. Mina pretended not to know the famous mouse.',
        'Bram told the story of a dragon who believed he was only useful when he was loud. People gathered close, making a circle instead of a crowd. The mayor laughed at the hat part. Afterwards, a small child asked if there would be stories next year too. Bram looked at Mina. A new tradition, it seemed, had arrived on a very quiet voice.'
      )}
    ],activity:'Fold or draw a paper lantern with a grown-up—use a drawing or a battery light, never a flame. Give it a symbol for something you enjoy doing.',reflect:'What is something you like about yourself that has nothing to do with being the loudest or the best?'
  }
];

export function findStory(id) {return STORIES.find(s=>s.id===id) || null;}
export function reading(text,level) {return text[Object.hasOwn(LEVELS,level)?level:'6-8'];}
export function puzzleAnswer(q) {return q.op==='+'?q.a+q.b:q.op==='−'?q.a-q.b:q.op==='×'?q.a*q.b:q.a/q.b;}
export function storyTranscript(story,level,route,ending) {
  if(!story.routes[route]||!story.endings[ending])throw new Error('Choose a story path and an ending.');
  return [reading(story.opening,level),reading(story.routes[route].text,level),reading(story.bridge,level),reading(story.endings[ending].text,level)];
}

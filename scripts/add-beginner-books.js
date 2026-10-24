import fs from 'fs';

// -----------------------------------------------------------------------------
// 1. Brüder Grimm: Kinder- und Hausmärchen für Anfänger (A1-A2)
// -----------------------------------------------------------------------------
const grimmsChapters = [
  {
    index: 0,
    id: 'rotkaeppchen',
    title: 'Rotkäppchen',
    html: `
<p><span class="reader-dropcap-letter">E</span>s war einmal ein kleines, süßes Mädchen. Jeder hatte sie lieb, der sie nur ansah. Am allerliebsten aber hatte sie ihre alte Großmutter. Die Großmutter schenkte dem Mädchen einmal ein kleines Käppchen von rotem Samt. Weil ihr das so gut stand und sie nichts anderes mehr tragen wollte, hieß sie nur noch das Rotkäppchen.</p>
<p>Eines Tages sprach ihre Mutter zu ihr: »Komm, Rotkäppchen! Hier hast du ein Stück Kuchen und eine Flasche Wein. Bring das der Großmutter hinaus in den Wald. Sie ist krank und schwach und wird sich daran laben. Sei aber artig und laufe nicht vom Wege ab, sonst fällst du und zerbrichst das Glas.«</p>
<p>»Ich will alles gut machen«, versprach Rotkäppchen der Mutter und gab ihr die Hand darauf. Die Großmutter aber wohnte draußen im Wald, eine halbe Stunde vom Dorf entfernt. Als Rotkäppchen nun in den Wald kam, begegnete ihr der Wolf.</p>
<p>Rotkäppchen aber wusste nicht, was das für ein böses Tier war, und fürchtete sich gar nicht vor ihm. »Guten Tag, Rotkäppchen!«, sprach der Wolf freundlich. »Schönen Dank, lieber Wolf«, antwortete das Mädchen. »Wohin so früh, Rotkäppchen?« »Zur Großmutter.« »Was trägst du denn unter der Schürze?« »Kuchen und Wein. Gestern haben wir gebacken, da soll sich die kranke Großmutter stärken.«</p>
<p>»Wo wohnt deine Großmutter, Rotkäppchen?« »Noch eine gute Viertelstunde weiter im Wald, unter den drei großen Eichen, da steht ihr Häuschen.« Der Wolf dachte bei sich: »Das junge, zarte Ding ist ein fetter Bissen, der wird noch besser schmecken als die Alte.«</p>
<p>Der Wolf ging ein Weilchen neben Rotkäppchen her und sprach dann: »Rotkäppchen, sieh doch einmal die schönen Blumen, die ringsumher stehen! Warum hörst du nicht, wie lieblich die Vöglein singen? Du gehst ja so ernsthaft, als wenn du zur Schule gingst, und es ist doch so lustig hier im Wald.«</p>
<p>Rotkäppchen schlug die Augen auf, und als es sah, wie die Sonnenstrahlen durch die Bäume tanzten und alles voller schöner Blumen stand, dachte es: »Wenn ich der Großmutter einen frischen Strauß mitbringe, wird sie sich freuen; es ist noch früh am Tag, ich komme noch zur rechten Zeit.« Und es lief vom Wege ab in den Wald hinein und suchte Blumen.</p>
<p>Der Wolf aber ging geradewegs zum Haus der Großmutter und klopfte an die Tür. »Wer ist draußen?« »Rotkäppchen, ich bringe Kuchen und Wein, mach mir auf!« »Drück nur auf die Klinke«, rief die Großmutter, »ich bin zu schwach und kann nicht aufstehen.« Der Wolf drückte auf die Klinke, die Tür sprang auf, und er verschlang die gute Großmutter im Nu.</p>
<p>Dann zog er ihre Kleider an, setzte ihre Haube auf, legte sich in ihr Bett und zog die Vorhänge zu. Rotkäppchen aber war nach den Blumen gelaufen, und als es so viele gesammelt hatte, dass es keine mehr tragen konnte, besann es sich wieder auf die Großmutter und ging zu ihrem Hause.</p>
<p>Es wunderte sich, dass die Haustür offen stand. Als es in die Stube trat, kam es ihm so seltsam vor. »Guten Morgen!«, rief es, bekam aber keine Antwort. Da trat es an das Bett und zog die Vorhänge zurück. Da lag die Großmutter und hatte die Haube tief ins Gesicht gezogen und sah so wunderlich aus.</p>
<p>»Ei, Großmutter, was hast du für große Ohren!« »Dass ich dich besser hören kann!« »Ei, Großmutter, was hast du für große Augen!« »Dass ich dich besser sehen kann!« »Ei, Großmutter, was hast du für große Hände!« »Dass ich dich besser packen kann!« »Aber, Großmutter, was hast du für ein furchtbar großes Maul!« »Dass ich dich besser fressen kann!«</p>
<p>Kaum hatte der Wolf das gesagt, da sprang er aus dem Bett und verschlang das arme Rotkäppchen. Als der Wolf seinen Hunger gestillt hatte, legte er sich wieder ins Bett, schlief ein und fing an, überlaut zu schnarchen.</p>
<p>Der Jäger ging eben an dem Haus vorbei und dachte: »Wie die alte Frau schnarcht! Du musst einmal nachsehen, ob ihr etwas fehlt.« Da trat er in die Stube, und als er vor das Bett kam, sah er, dass der Wolf darin lag. »Finde ich dich hier, du alter Sünder!«, sagte er. Da nahm er eine Schere und schnitt dem schlafenden Wolf den Bauch auf.</p>
<p>Kaum hatte er ein paar Schnitte getan, da sah er das rote Käppchen leuchten, und noch ein paar Schnitte, da sprang das Mädchen heraus und rief: »Ach, wie war ich erschrocken, wie war es so dunkel in dem Wolf!« Und dann kam die alte Großmutter auch noch lebendig heraus. Rotkäppchen aber holte schnell große Steine, damit füllten sie dem Wolf den Leib. Als er aufwachte, wollte er fortspringen, aber die Steine waren so schwer, dass er sogleich niedersank und tot umfiel.</p>
<p>Da waren alle drei vergnügt. Der Jäger nahm den Pelz des Wolfes mit nach Hause, die Großmutter aß den Kuchen und trank den Wein, und Rotkäppchen dachte: »Ich will mein Lebtag nicht wieder allein vom Wege ablaufen in den Wald, wenn es mir die Mutter verboten hat.«</p>
`
  },
  {
    index: 1,
    id: 'haensel-und-gretel',
    title: 'Hänsel und Gretel',
    html: `
<p><span class="reader-dropcap-letter">V</span>or einem großen Walde wohnte ein armer Holzhacker mit seiner Frau und seinen zwei Kindern. Das Bübchen hieß Hänsel und das Mädchen Gretel. Er hatte wenig zu beißen und zu brechen, und einmal, als große Teuerung ins Land kam, konnte er auch das tägliche Brot nicht mehr schaffen.</p>
<p>Wie er sich nun nachts im Bett Gedanken machte, seufzte er und sprach zu seiner Frau: »Was soll aus uns werden? Wie können wir unsere armen Kinder ernähren, da wir für uns selbst nichts mehr haben?«</p>
<p>»Weißt du was, Mann«, antwortete die Frau, »wir wollen morgen in aller Frühe die Kinder hinaus in den Wald führen, wo er am dicksten ist. Da machen wir ihnen ein Feuer an und geben jedem noch ein Stückchen Brot, dann gehen wir an unsere Arbeit und lassen sie allein. Sie finden den Weg nicht mehr nach Hause, und wir sind sie los.«</p>
<p>»Nein, Frau«, sagte der Mann, »das tue ich nicht; wie sollt ich mein Herz überschlagen, meine Kinder im Walde allein zu lassen! Die wilden Tiere würden bald kommen und sie zerreißen.« »O, du Narr«, sagte sie, »dann müssen wir alle viere Hungers sterben!« Und sie ließ ihm keine Ruhe, bis er einwilligte.</p>
<p>Die zwei Kinder hatten vor Hunger auch nicht schlafen können und hatten gehört, was die Stiefmutter zum Vater gesagt hatte. Gretel weinte bittere Tränen und sprach zu Hänsel: »Nun ist es um uns geschehen.« »Still, Gretel«, sprach Hänsel, »gräme dich nicht, ich will uns schon helfen.«</p>
<p>Und als die Alten eingeschlafen waren, stand er auf, zog sein Röcklein an, machte die Untertür auf und schlich sich hinaus. Der Mond schien ganz helle, und die weißen Kieselsteine, die vor dem Hause lagen, glänzten wie lauter Batzen. Hänsel bückte sich und steckte so viele in sein Rocktäschlein, als nur hineingehen wollten.</p>
<p>Am frühen Morgen, noch ehe die Sonne aufging, kam schon die Frau und weckte die beiden Kinder: »Steht auf, ihr Faulenzer, wir wollen in den Wald gehen und Holz holen!« Da gab sie jedem ein Stückchen Brot und sprach: »Da habt ihr etwas für den Mittag, aber esst es nicht vorher auf, weiter kriegt ihr nichts.« Gretel nahm das Brot unter die Schürze, weil Hänsel die Steine in der Tasche hatte. Danach machten sie sich alle zusammen auf den Weg nach dem Wald.</p>
<p>Wenn sie ein Weilchen gegangen waren, stand Hänsel still und guckte nach dem Hause zurück. Der Vater sprach: »Hänsel, wonach guckst du da und bleibst zurück, hab acht und vergiß deine Beine nicht!« »Ach, Vater«, sagte Hänsel, »ich sehe nach meinem weißen Kätzchen, das sitzt oben auf dem Dach und will mir Ade sagen.« Die Frau sprach: »Narr, das ist deine Katze nicht, das ist die Morgensonne, die auf den Schornstein scheint.« Hänsel aber hatte nicht nach dem Kätzchen gesehen, sondern immer einen von den blanken Kieselsteinen aus seiner Tasche auf den Weg geworfen.</p>
<p>Mitten im Walde machten sie ein Feuer, und die Eltern gingen fort. Hänsel und Gretel schliefen ein. Als sie erwachten, war es finstere Nacht. Hänsel tröstete sein Schwesterchen: »Warte nur, bis der Mond aufgeht, dann werden wir die Kieselsteine sehen, die ich ausgestreut habe; die zeigen uns den Weg nach Haus.« Als der Mond aufstieg, nahmen sie einander an der Hand und folgten den Kieselsteinen, die glänzten wie frisch geschlagene Batzen, und zeigten ihnen den Weg.</p>
<p>Sie gingen die ganze Nacht hindurch und kamen bei anbrechendem Tage wieder bei ihres Vaters Haus an. Der Vater freute sich von Herzen, denn es war ihm schwergefallen, sie so allein zu lassen.</p>
<p>Nicht lange danach war wieder Not in allen Ecken, und die Kinder hörten, wie die Mutter nachts im Bette zu dem Vater sprach: »Alles ist wieder aufgezehrt, wir haben noch einen halben Laib Brot, hernach hat das Lied ein Ende. Die Kinder müssen fort; wir wollen sie tiefer in den Wald hineinführen, damit sie den Weg nicht wieder herausfinden.«</p>
<p>Hänsel wollte wieder aufstehen und Kieselsteine auflesen, aber die Frau hatte die Tür verschlossen. Doch Hänsel tröstete Gretel: »Weine nicht, Gretel, schlaf nur ruhig, der liebe Gott wird uns schon helfen.« Am nächsten Morgen streute Hänsel Brotbröcklein auf den Weg. Aber die Vögel, die im Walde flogen, pickten alle Bröcklein auf.</p>
<p>Da verirrten sich die Kinder tief im Walde. Am dritten Tage sahen sie ein schneeweißes Vöglein, das sang so schön, dass sie stehenblieben und ihm zuhörten. Und als es fertig war, schwang es seine Flügel und flog vor ihnen her, und sie gingen ihm nach, bis sie zu einem Häuschen gelangten. Und als sie ganz nah herankamen, so sahen sie, dass das Häuschen aus Brot gebaut war und mit Kuchen gedeckt; aber die Fenster waren von hellem Zucker!</p>
<p>»Da wollen wir uns ansetzen«, sprach Hänsel, »und eine gesegnete Mahlzeit tun. Ich will ein Stück vom Dach essen, Gretel, du kannst vom Fenster essen, das schmeckt süß.« Hänsel reichte in die Höhe und brach sich ein wenig vom Dach ab, um zu versuchen, wie es schmeckte, und Gretel stellte sich an die Scheiben und knusperte daran.</p>
<p>Da rief eine feine Stimme aus der Stube heraus:</p>
<p style="text-align: center; font-style: italic; font-weight: bold; color: var(--read-primary);">»Knusper, knusper, Knäuschen,<br>wer knuspert an meinem Häuschen?«</p>
<p>Die Kinder antworteten:</p>
<p style="text-align: center; font-style: italic; font-weight: bold; color: var(--read-primary);">»Der Wind, der Wind,<br>das himmlische Kind!«</p>
<p>und aßen weiter, ohne sich irre machen zu lassen. Doch plötzlich ging die Tür auf, und eine uralte Frau kam herausgeschlichen. Es war eine böse Hexe, die den Kindern auflauerte und das Brothäuschen gebaut hatte, um sie herbeizulocken.</p>
<p>Doch das kluge Gretel überlistete die Hexe am großen Backofen, stieß sie hinein und schloss die eiserne Tür! Da lief Gretel schnurgerade zum Hänsel, machte sein Ställchen auf und rief: »Hänsel, wir sind erlöst, die alte Hexe ist tot!«</p>
<p>Sie füllten ihre Taschen mit Perlen und Edelsteinen aus dem Hexenhaus und fanden mit Hilfe einer weißen Ente über das große Wasser glücklich den Weg nach Hause zurück. Da war alle Not zu Ende, und sie lebten in lauter Freude zusammen.</p>
`
  },
  {
    index: 2,
    id: 'bremer-stadtmusikanten',
    title: 'Die Bremer Stadtmusikanten',
    html: `
<p><span class="reader-dropcap-letter">E</span>s hatte ein Mann einen Esel, der schon lange Jahre die Säcke unverdrossen zur Mühle getragen hatte. Nun aber nahmen seine Kräfte ab, so dass er zur Arbeit immer untauglicher ward. Da dachte der Herr daran, ihn aus dem Futter zu schaffen; aber der Esel merkte, dass kein guter Wind wehte, lief fort und machte sich auf den Weg nach Bremen. »Dort«, dachte er, »kannst du ja Stadtmusikant werden.«</p>
<p>Als er ein Weilchen fortgegangen war, fand er einen Jagdhund auf dem Wege liegen, der jappte wie einer, der sich müde gelaufen hat. »Nun, warum jappst du so, Packan?«, fragte der Esel. »Ach«, sagte der Hund, »weil ich alt bin und jeden Tag schwächer werde, auch auf der Jagd nicht mehr fortkann, hat mich mein Herr totschlagen wollen; da habe ich Reißaus genommen. Aber womit soll ich nun mein Brot verdienen?«</p>
<p>»Weißt du was«, sprach der Esel, »ich gehe nach Bremen und werde dort Stadtmusikant, geh mit und lass dich auch bei der Musik annehmen. Ich spiele die Laute, und du schlägst die Pauken.« Der Hund war es zufrieden, und sie gingen weiter.</p>
<p>Es dauerte nicht lange, da saß eine Katze an dem Weg und machte ein Gesicht wie drei Tage Regenwetter. »Nun, was ist dir in die Quere gekommen, alter Bartputzer?«, fragte der Esel. »Wer kann da lustig sein, wenn es einem an den Kragen geht«, antwortete die Katze; »weil ich nun zu Jahren komme, meine Zähne stumpf werden und ich lieber hinter dem Ofen sitze und spinne, als nach Mäusen jage, hat mich meine Frau ersäufen wollen. Ich habe mich zwar noch fortgemacht, aber nun ist guter Rat teuer: wo soll ich hin?«</p>
<p>»Geh mit uns nach Bremen! Du verstehst dich doch auf die Nachtmusik, da kannst du Stadtmusikant werden.« Die Katze hielt das für gut und ging mit.</p>
<p>Darauf kamen die drei Ausreißer an einem Hof vorbei; da saß auf dem Tor der Haushahn und schrie aus Leibeskräften: »Kikeriki!« »Du schreist einem durch Mark und Bein«, sprach der Esel, »was hast du vor?« »Die Hausfrau hat der Köchin befohlen, mir heute Abend den Kopf abzuschneiden, morgen am Sonntag wollen sie mich in der Suppe essen. Nun schrei ich aus vollem Hals, solang ich noch kann.«</p>
<p>»Ei was, du Rotschopf«, sagte der Esel, »zieh lieber mit uns fort! Wir gehen nach Bremen, etwas Besseres als den Tod findest du überall. Du hast eine gute Stimme, und wenn wir zusammen musizieren, so muss es eine Art haben.« Dem Hahn gefiel der Vorschlag, und sie gingen alle viere zusammen fort.</p>
<p>Sie konnten aber die Stadt Bremen an einem Tag nicht erreichen und kamen abends in einen Wald, wo sie übernachten wollten. Der Esel und der Hund legten sich unter einen großen Baum, die Katze und der Hahn stiegen in die Äste hinauf, der Hahn aber flog bis in die Spitze, wo es am sichersten für ihn war.</p>
<p>Ehe er einschlief, sah er sich noch einmal nach allen vier Winden um; da deuchte ihn, er sähe in der Ferne ein Fünkchen brennen. Er rief seinen Gesellen zu, es müsse nicht gar weit ein Haus sein, denn es scheine ein Licht. Da machten sie sich auf den Weg nach der Gegend, wo das Licht war, und sahen es bald heller schimmern, bis sie vor ein hell erleuchtetes Räuberhaus kamen.</p>
<p>Der Esel, als der Größte, näherte sich dem Fenster und schaute hinein. »Was siehst du, Grauschimmel?«, fragte der Hahn. »Was ich sehe?«, antwortete der Esel, »einen gedeckten Tisch mit schönem Essen und Trinken, und Räuber sitzen daran und lassen sich's wohl sein.« »Das wäre wohl etwas für uns«, sprach der Hahn.</p>
<p>Da überlegten die Tiere, wie sie es anfangen müssten, um die Räuber hinauszujagen. Endlich fanden sie ein Mittel: Der Esel musste sich mit den Vorderfüßen auf das Fenster stellen, der Hund auf des Esels Rücken springen, die Katze auf den Hund klettern, und endlich flog der Hahn hinauf und setzte sich der Katze auf den Kopf.</p>
<p>Wie das geschehen war, fingen sie auf ein Zeichen insgesamt an, ihre Musik zu machen: der Esel schrie, der Hund bellte, die Katze miaute und der Hahn krähte! Dann stürzten sie durch das Fenster in die Stube hinein, dass die Scheiben klirrten!</p>
<p>Die Räuber fuhren mit Entsetzen in die Höhe, meinten nicht anders, als ein Gespenst käme herein, und flohen in größter Furcht hinaus in den Wald. Nun setzten sich die vier Gesellen an den Tisch, nahmen mit dem vorlieb, was übriggeblieben war, und aßen, als wenn sie vier Wochen hungern sollten.</p>
<p>Als die vier Spielleute fertig waren, löschten sie das Licht aus und suchten sich eine Schlafstätte, jeder nach seiner Natur: Der Esel legte sich auf den Mist, der Hund hinter die Tür, die Katze auf den Herd bei der warmen Asche, und der Hahn flog auf den Hahnenbalken. Und weil sie müde waren von ihrem langen Weg, schliefen sie bald ein.</p>
<p>Als Mitternacht vorbei war und die Räuber von weitem sahen, dass kein Licht mehr im Hause brannte, sprach der Hauptmann: »Wir hätten uns doch nicht sollen ins Bockshorn jagen lassen!«, und hieß einen hingehen und das Haus untersuchen.</p>
<p>Der Kundschafter ging in die Küche, um ein Licht anzuzünden. Da sah er die feurigen Augen der Katze und meinte, es wären glühende Kohlen; er hielt ein Schwefelhölzchen daran, dass es Feuer fangen sollte. Aber die Katze verstand keinen Spaß, sprang ihm ins Gesicht, spie und kratzte.</p>
<p>Da erschrak er gewaltig und lief zur Hintertür hinaus; aber der Hund, der da lag, sprang auf und biss ihn ins Bein. Und als er über den Hof am Mist vorbeirannte, gab ihm der Esel mit dem Hinterfuß noch einen tüchtigen Schlag. Der Hahn aber, der vom Lärmen aus dem Schlaf geweckt worden war, rief vom Balken herab: »Kikeriki!«</p>
<p>Da lief der Räuber, was er konnte, zu seinem Hauptmann zurück und sprach: »Ach, in dem Haus sitzt eine gräuliche Hexe, die hat mich angehaucht und mir mit ihren langen Fingern das Gesicht zerkratzt! Und vor der Tür steht ein Mann mit einem Messer, der hat mich ins Bein gestochen! Und auf dem Hof liegt ein schwarzes Ungeheuer, das hat mit einer Keule auf mich losgeschlagen! Und oben auf dem Dache, da sitzt der Richter, der rief: 'Bringt mir den Schelm herbei!' Da hab ich mich gemacht, dass ich fortkam!«</p>
<p>Von nun an getrauten sich die Räuber nicht mehr in das Haus; den vier Bremer Stadtmusikanten aber gefiel's darin so wohl, dass sie nicht wieder herauswollten. Und der das zuletzt erzählt hat, dem ist der Mund noch warm!</p>
`
  },
  {
    index: 3,
    id: 'dornroeschen',
    title: 'Dornröschen',
    html: `
<p><span class="reader-dropcap-letter">I</span>n den alten Zeiten, wo das Wünschen noch geholfen hat, lebte ein König und eine Königin. Die sprachen jeden Tag: »Ach, wenn wir doch ein Kind hätten!«, und kriegten doch keins.</p>
<p>Da trug es sich zu, als die Königin einmal im Bade saß, dass ein Frosch aus dem Wasser ans Land kroch und zu ihr sprach: »Dein Wunsch wird erfüllt werden; ehe ein Jahr vergeht, wirst du eine Tochter zur Welt bringen.«</p>
<p>Was der Frosch gesagt hatte, das geschah, und die Königin gebar ein Mädchen, das war so schön, dass der König vor Freude sich nicht zu lassen wusste und ein großes Fest anstellte. Er lud nicht bloß seine Verwandten, Freunde und Bekannten ein, sondern auch die weisen Frauen, damit sie dem Kinde hold und gewogen wären.</p>
<p>Es waren ihrer dreizehn in seinem Reiche; weil er aber nur zwölf goldene Teller hatte, von welchen sie essen sollten, so musste eine von ihnen daheimbleiben. Das Fest ward mit aller Pracht gefeiert, und als es zu Ende war, beschenkten die weisen Frauen das Kind mit ihren Wundergaben: die eine mit Tugend, die andere mit Schönheit, die dritte mit Reichtum, und so mit allem, was auf der Welt zu wünschen ist.</p>
<p>Als elf ihre Sprüche eben getan hatten, trat plötzlich die dreizehnte herein. Sie wollte sich dafür rächen, dass sie nicht eingeladen war, und rief mit lauter Stimme: »Die Königstochter soll sich in ihrem fünfzehnten Jahr an einer Spindel stechen und tot hinfallen!«</p>
<p>Alle waren erschrocken. Da trat die zwölfte hervor, die ihren Wunsch noch übrig hatte; und weil sie den bösen Ausspruch nicht aufheben, sondern nur mildern konnte, so sagte sie: »Es soll aber kein Tod sein, sondern ein hundertjähriger tiefer Schlaf, in welchen die Königstochter fällt.«</p>
<p>Der König, der sein liebes Kind vor dem Unglück gern bewahren wollte, ließ den Befehl ausgehen, dass alle Spindeln im ganzen Königreiche verbrannt werden sollten. An dem Mädchen aber wurden die Gaben der weisen Frauen sämtlich erfüllt, denn es war so schön, sittsam, freundlich und verständig, dass es jedermann, der es ansah, liebhaben musste.</p>
<p>Es geschah, dass an dem Tage, wo es gerade fünfzehn Jahre alt ward, der König und die Königin nicht zu Hause waren und das Mädchen ganz allein im Schlosse zurückblieb. Da ging es allerorten herum, besah Stuben und Kammern, wie es Lust hatte, und kam endlich auch an einen alten Turm.</p>
<p>Es stieg die enge Wendeltreppe hinauf und gelangte zu einer kleinen Tür. In dem Schloss steckte ein verrosteter Schlüssel, und als es ihn umdrehte, sprang die Tür auf, und da saß in einem kleinen Stübchen eine alte Frau mit einer Spindel und spann emsig ihren Flachs.</p>
<p>»Guten Tag, altes Mütterchen«, sprach die Königstochter, »was machst du da?« »Ich spinne«, sagte die Alte und nickte mit dem Kopf. »Was ist das für ein Ding, das so lustig herumspringt?«, sprach das Mädchen, nahm die Spindel und wollte auch spinnen. Kaum hatte sie aber die Spindel angerührt, so ging der Zauberspruch in Erfüllung, und sie stach sich damit in den Finger.</p>
<p>In dem Augenblick, wo sie den Stich empfand, fiel sie auf das Bett nieder, das da stand, und lag in einem tiefen Schlaf. Und dieser Schlaf verbreitete sich über das ganze Schloss: Der König und die Königin, die eben heimgekommen waren und in den Saal getreten waren, fingen an einzuschlafen, und der ganze Hofstaat mit ihnen.</p>
<p>Da schliefen auch die Pferde im Stall, die Hunde im Hofe, die Tauben auf dem Dache, die Fliegen an der Wand, ja, das Feuer, das auf dem Herde flackerte, ward still und schlief ein, und der Braten hörte auf zu brutzeln, und der Koch, der den Küchenjungen an den Haaren ziehen wollte, ließ ihn los und schlief.</p>
<p>Rings um das Schloss aber begann eine Dornenhecke zu wachsen, die jedes Jahr höher ward und endlich das ganze Schloss umzog und darüber hinauswuchs, dass gar nichts mehr davon zu sehen war, selbst nicht die Fahne auf dem Dach. Es ging aber die Sage im Lande von dem schönen schlafenden Dornröschen, denn so ward die Königstochter genannt, so dass von Zeit zu Zeit Königssöhne kamen und durch die Hecke in das Schloss dringen wollten. Es war ihnen aber nicht möglich, denn die Dornen hielten fest zusammen wie an Händen, und die Jünglinge blieben darin hängen und starben eines jammervollen Todes.</p>
<p>Nach langen, langen Jahren kam wieder einmal ein Königssohn in das Land. Da erzählte ihm ein alter Mann von der Dornenhecke, es sollte ein Schloss dahinter stehen, worin eine wunderschöne Königstochter, Dornröschen genannt, schon seit hundert Jahren schliefe, und mit ihr der König und die Königin und der ganze Hofstaat. Da sprach der Jüngling: »Ich fürchte mich nicht, ich will hinaus und das schöne Dornröschen sehen.«</p>
<p>Nun waren aber gerade die hundert Jahre verflossen, und der Tag war gekommen, wo Dornröschen wieder erwachen sollte. Als der Königssohn sich der Dornenhecke nahte, waren es lauter große, schöne Blumen, die taten sich von selbst auseinander und ließen ihn unbeschädigt hindurch, und hinter ihm schlossen sie sich wieder als eine Hecke zusammen.</p>
<p>Im Schlosshof sah er die Pferde und scheckigen Jagdhunde liegen und schlafen, auf dem Dache saßen die Tauben und hatten das Köpfchen unter den Flügel gesteckt. Und als er ins Haus trat, schliefen die Fliegen an der Wand, der Koch in der Küche hielt noch die Hand, als wolle er den Jungen anpacken, und die Magd saß vor dem schwarzen Huhn, das sollte gerupft werden.</p>
<p>Da ging er weiter und sah im Saale den ganzen Hofstaat liegen und schlafen, und oben beim Throne lagen der König und die Königin. Da ging er noch weiter, und alles war so still, dass er seinen Atem hören konnte, und endlich kam er zu dem Turm und öffnete die Türe zu der kleinen Stube, in welcher Dornröschen schlief.</p>
<p>Da lag es und war so schön, dass er die Augen nicht abwenden konnte, und er bückte sich und gab ihm einen Kuss. Wie er es mit dem Kuss berührt hatte, schlug Dornröschen die Augen auf, erwachte und blickte ihn ganz freundlich an.</p>
<p>Da gingen sie zusammen herab, und der König erwachte und die Königin und der ganze Hofstaat und sahen einander mit großen Augen an. Und die Pferde im Hof standen auf und rüttelten sich; die Jagdhunde sprangen und wedelten; die Tauben auf dem Dach zogen das Köpfchen unterm Flügel hervor, sahen umher und flogen ins Feld; die Fliegen an den Wänden krochen weiter; das Feuer in der Küche erhob sich, flackerte und kochte das Essen; der Braten briet weiter; und der Koch gab dem Jungen eine Ohrfeige, dass er schrie; und die Magd rupfte das Huhn fertig.</p>
<p>Und da ward die Hochzeit des Königssohns mit dem Dornröschen in aller Pracht gefeiert, und sie lebten vergnügt bis an ihr Ende.</p>
`
  },
  {
    index: 4,
    id: 'froschkoenig',
    title: 'Der Froschkönig',
    html: `
<p><span class="reader-dropcap-letter">I</span>n den alten Zeiten, wo das Wünschen noch geholfen hat, lebte ein König, dessen Töchter waren alle schön; aber die jüngste war so schön, dass die Sonne selber, die doch so vieles gesehen hat, sich verwunderte, sooft sie ihr ins Gesicht schien.</p>
<p>Nahe bei dem Schlosse des Königs lag ein großer, dunkler Wald, und in dem Walde unter einer alten Linde war ein Brunnen. Wenn nun der Tag sehr heiß war, so ging das Königskind hinaus in den Wald und setzte sich an den Rand des kühlen Brunnens. Und wenn sie Langeweile hatte, so nahm sie eine goldene Kugel, warf sie in die Höhe und fing sie wieder; und das war ihr liebstes Spielwerk.</p>
<p>Nun trug es sich einmal zu, dass die goldene Kugel der Königstochter nicht in ihr Händchen fiel, sondern auf die Erde schlug und geradezu ins Wasser hineinrollte. Die Königstochter folgte ihr mit den Augen nach, aber die Kugel verschwand, und der Brunnen war tief, so tief, dass man keinen Grund sah. Da fing sie an zu weinen und weinte immer lauter und konnte sich gar nicht trösten.</p>
<p>Und wie sie so klagte, rief ihr jemand zu: »Was hast du vor, Königstochter? Du weinst ja, dass sich ein Stein erbarmen möchte.« Sie sah sich um, woher die Stimme käme, da erblickte sie einen Frosch, der seinen dicken, hässlichen Kopf aus dem Wasser streckte.</p>
<p>»Ach, du bist's, alter Wasserpatscher«, sagte sie, »ich weine über meine goldene Kugel, die mir in den Brunnen hinabgefallen ist.« »Sei still und weine nicht«, antwortete der Frosch, »ich kann wohl Rat schaffen, aber was gibst du mir, wenn ich dein Spielwerk wieder heraufhole?«</p>
<p>»Was du haben willst, lieber Frosch«, sagte sie, »meine Kleider, meine Perlen und Edelsteine, auch noch die goldene Krone, die ich trage.« Der Frosch antwortete: »Deine Kleider, deine Perlen und Edelsteine und deine goldene Krone, die mag ich nicht. Aber wenn du mich liebhaben willst, und ich soll dein Geselle und Spielkamerad sein, an deinem Tischlein neben dir sitzen, von deinem goldenen Tellerlein essen, aus deinem Becherlein trinken und in deinem Bettlein schlafen: wenn du mir das versprichst, so will ich hinuntersteigen und dir die goldene Kugel wieder heraufholen.«</p>
<p>»Ach ja«, sagte sie, »ich verspreche dir alles, was du willst, wenn du mir nur die Kugel wiederbringst.« Sie dachte aber: »Was der einfältige Frosch schwätzt! Der sitzt im Wasser bei seinesgleichen und quakt und kann keines Menschen Geselle sein.«</p>
<p>Der Frosch, als er die Zusage erhalten hatte, tauchte seinen Kopf unter, sank hinab, und über ein Weilchen kam er wieder heraufgerudert, hatte die Kugel im Maul und warf sie ins Gras. Die Königstochter war voll Freude, als sie ihr schönes Spielwerk wieder erblickte, hob es auf und sprang damit fort.</p>
<p>»Warte, warte!«, rief der Frosch, »nimm mich mit, ich kann nicht so laufen wie du!« Aber was half es ihm, dass er ihr sein Quak, Quak so laut nachschrie, als er konnte! Sie hörte nicht darauf, eilte nach Hause und hatte den armen Frosch bald vergessen, der wieder in seinen Brunnen hinabsteigen musste.</p>
<p>Am andern Tage, als sie mit dem König und allen Hofleuten sich zu Tische gesetzt hatte und von ihrem goldenen Tellerlein aß, da kam etwas die Marmortreppe heraufgekrochen: plitsch, platsch, plitsch, platsch! Und als es oben war, klopfte es an der Tür und rief: »Königstochter, jüngste, mach mir auf!«</p>
<p>Sie lief und wollte sehen, wer draußen wäre; als sie aber aufmachte, so saß der Frosch davor. Da warf sie die Tür hastig zu, setzte sich wieder an den Tisch, und war ihr ganz angst. Der König sah wohl, dass ihr das Herz gewaltig klopfte, und sprach: »Mein Kind, warum fürchtest du dich? Steht etwa ein Riese vor der Tür und will dich holen?« »Ach nein«, antwortete sie, »es ist kein Riese, sondern ein garstiger Frosch.«</p>
<p>»Was will der Frosch von dir?« »Ach, lieber Vater, als ich gestern im Wald am Brunnen saß und spielte, fiel meine goldene Kugel ins Wasser. Und weil ich so weinte, hat sie der Frosch wieder heraufgeholt; und weil er es durchaus verlangte, so versprach ich ihm, er sollte mein Geselle werden; ich dachte aber nimmermehr, dass er aus seinem Wasser herauskönnte. Nun ist er draußen und will zu mir herein.«</p>
<p>Indem klopfte es zum zweiten Mal und rief:</p>
<p style="text-align: center; font-style: italic; font-weight: bold; color: var(--read-primary);">»Königstochter, jüngste,<br>mach mir auf!<br>Weißt du nicht, was gestern<br>du zu mir gesagt<br>bei dem kühlen Wasserbrunnen?<br>Königstochter, jüngste,<br>mach mir auf!«</p>
<p>Da sagte der König: »Was du versprochen hast, das musst du auch halten; geh nur und mach ihm auf.« Sie ging und öffnete die Türe, da hüpfte der Frosch herein, ihr immer auf dem Fuße nach, bis zu ihrem Stuhl. Da saß er und rief: »Heb mich herauf zu dir!«</p>
<p>Sie zauderte, bis es endlich der König befahl. Als der Frosch erst auf dem Stuhl war, wollte er auf den Tisch, und als er da saß, sprach er: »Nun schieb mir dein goldenes Tellerlein näher, damit wir zusammen essen.« Das tat sie zwar, aber man sah wohl, dass sie's nicht gerne tat. Dem Frosch schmeckte es sichtlich wohl, aber ihr blieb fast jedes Bissen im Halse stecken.</p>
<p>Endlich sprach er: »Ich habe mich sattgegessen und bin müde; nun trag mich in dein Kämmerlein und mach dein seiden Bettlein zurecht, da wollen wir uns schlafen legen.« Da fing die Königstochter an zu weinen und fürchtete sich vor dem kalten Frosch, den sie sich nicht anzurühren getraute und der nun in ihrem schönen, reinen Bettlein schlafen sollte.</p>
<p>Der König aber ward zornig und sprach: »Wer dir geholfen hat, als du in der Not warst, den sollst du hernach nicht verachten.« Da packte sie ihn mit zwei Fingern, trug ihn hinauf und setzte ihn in eine Ecke. Als sie aber im Bette lag, kroch er heran und sprach: »Ich bin müde, ich will schlafen so gut wie du; heb mich herauf, oder ich sag's deinem Vater.«</p>
<p>Da ward sie erst bitterböse, holte ihn herauf und warf ihn aus allen Kräften gegen die Wand: »Nun wirst du Ruhe haben, du garstiger Frosch!«</p>
<p>Als er aber herabfiel, war er kein Frosch mehr, sondern ein Königssohn mit schönen, freundlichen Augen. Der war nun nach ihres Vaters Willen ihr lieber Geselle und Gemahl. Er erzählte ihr, er wäre von einer bösen Hexe verwünscht worden, und niemand hätte ihn aus dem Brunnen erlösen können als sie allein, und morgen wollten sie zusammen in sein Reich fahren.</p>
<p>Dann schliefen sie ein, und am andern Morgen, als die Sonne sie aufweckte, kam ein Wagen herangefahren, mit acht weißen Pferden bespannt, die hatten weiße Straußfedern auf dem Kopf und gingen in goldenen Ketten. Und hinten stand der treue Heinrich, der Diener des jungen Königs. Der treue Heinrich hatte sich so betrübt, als sein Herr war in einen Frosch verwandelt worden, dass er drei eiserne Bande um sein Herz hatte legen lassen, damit es ihm nicht vor Weh und Traurigkeit zerspränge.</p>
<p>Der Wagen sollte den jungen König in sein Reich abholen; der treue Heinrich hob beide hinein und stellte sich selber wieder hintenauf. Und als sie ein Stück Wegs gefahren waren, hörte der Königssohn hinter sich ein Krachen, als wäre etwas zerbrochen. Da drehte er sich um und rief: »Heinrich, der Wagen bricht!«</p>
<p>»Nein, Herr, der Wagen nicht, es ist ein Band von meinem Herzen, das da lag in großen Schmerzen, als Ihr in dem Brunnen saßt, als Ihr eine Fretsche (Frosch) wart.« Noch einmal und noch einmal krachte es auf dem Weg, und der Königssohn meinte immer, der Wagen bräche, und es waren doch nur die Bande, die vom Herzen des treuen Heinrich absprangen, weil sein Herr nun erlöst und glücklich war.</p>
`
  }
];

const grimmsBook = {
  id: 'grimms-maerchen',
  title: 'Märchen der Brüder Grimm',
  author: 'Jacob & Wilhelm Grimm',
  year: '1812',
  language: 'de',
  languageFlag: '🇩🇪',
  languageName: 'German',
  targetLanguage: 'en',
  featured: true,
  difficulty: 'Beginner (A1-A2)',
  difficultyLevel: 'beginner',
  genre: 'Fairy Tales & Legends',
  chaptersCount: grimmsChapters.length,
  cover: '',
  description: 'The world\'s most famous German fairy tales rewritten in clear, accessible German for language beginners. Includes Rotkäppchen, Hänsel und Gretel, and Die Bremer Stadtmusikanten.',
  gutenbergUrl: 'https://www.gutenberg.org/ebooks/2591',
  chapters: grimmsChapters
};

fs.writeFileSync('./assets/books/grimms-maerchen.json', JSON.stringify(grimmsBook, null, 2));
console.log('Saved grimms-maerchen.json with', grimmsChapters.length, 'chapters.');

// -----------------------------------------------------------------------------
// 2. Deutsche Fabeln für Anfänger (A1 - Ultra Short Animal Fables)
// -----------------------------------------------------------------------------
const fabelnChapters = [
  {
    index: 0,
    id: 'fuchs-und-trauben',
    title: 'Der Fuchs und die Trauben',
    html: `
<p><span class="reader-dropcap-letter">E</span>in hungriger Fuchs schlich an einem heißen Sommertag durch einen Weinberg. Hoch oben an einem Weinstock erblickte er herrliche, reife Weintrauben. Die Trauben schimmerten blau und saftig in der Sonne.</p>
<p>»Genau das Richtige, um meinen Durst und meinen Hunger zu stillen!«, dachte der Fuchs erfreut. Er trat ein paar Schritte zurück, nahm Anlauf und sprang aus allen Kräften in die Höhe.</p>
<p>Aber er verfehlte die Trauben um ein ganzes Stück. Der Fuchs gab jedoch nicht auf. Er schüttelte den Staub von seinem Fell, ging noch weiter zurück und sprang ein zweites Mal empor. Wieder schnappten seine Zähne nur ins Leere.</p>
<p>Er versuchte es ein drittes, viertes und fünftes Mal, bis er völlig erschöpft und keuchend am Boden saß. Da rümpfte er hochmütig die Nase, wandte sich ab und sagte laut:</p>
<p>»Ach was! Die Trauben sind mir noch viel zu sauer und unreif. Ich mag gar keine sauren Trauben essen!«</p>
<p>Und stolz trabte er davon.</p>
<p style="font-style: italic; color: var(--read-primary); margin-top: 1.5rem; border-left: 3px solid var(--read-primary); padding-left: 0.8rem;">
<strong>Moral:</strong> Viele Menschen tun so, als verachteten sie das, was sie mit eigener Kraft nicht erreichen können.
</p>
`
  },
  {
    index: 1,
    id: 'schildkroete-und-hase',
    title: 'Die Schildkröte und der Hase',
    html: `
<p><span class="reader-dropcap-letter">E</span>in junger Hase prahlte eines Tages vor allen Tieren des Waldes mit seiner Schnelligkeit. »Niemand kann mich im Laufen besiegen!«, rief er übermütig. »Wer von euch wagt ein Wettrennen mit mir?«</p>
<p>Die Tiere schwiegen betreten. Da trat die alte Schildkröte langsam hervor und sagte mit ruhiger Stimme: »Ich nehme deine Herausforderung an, Hase.«</p>
<p>Der Hase lachte schallend. »Du? Mit deinen kurzen Beinchen und deinem schweren Panzer? Das ist doch ein Scherz!« »Behalte dein Lachen bis nach dem Ziel«, erwiderte die Schildkröte gelassen.</p>
<p>Der Fuchs steckte die Rennstrecke ab und rief das Startsignal. Der Hase schoss wie ein Pfeil davon und war im Nu außer Sichtweite. Die Schildkröte aber setzte bedächtig einen Fuß vor den andern und ging ohne Unterbrechung voran.</p>
<p>Als der Hase die Hälfte der Strecke hinter sich hatte, blickte er zurück. Von der Schildkröte war weit und breit nichts zu sehen. »Die holt mich im Leben nicht ein«, dachte der siegesgewisse Hase. »Es ist so ein schöner Tag, ich will mich ein Weilchen unter diesen Baum ins weiche Gras legen und schlafen.«</p>
<p>Er schloss die Augen und schlief tief und fest ein. Die Schildkröte aber wanderte Schritt für Schritt weiter. Sie machte keine Rast, bis sie den schlafenden Hasen leise überholte und sich dem Ziel näherte.</p>
<p>Als der Hase endlich erwachte, stand die Sonne schon tief. Er sprang erschrocken auf und rannte, so schnell seine Beine ihn trugen, auf das Ziel zu. Doch als er ankam, sah er die Schildkröte bereits gemütlich an der Ziellinie sitzen. Alle Tiere des Waldes jubelten ihr zu.</p>
<p style="font-style: italic; color: var(--read-primary); margin-top: 1.5rem; border-left: 3px solid var(--read-primary); padding-left: 0.8rem;">
<strong>Moral:</strong> Beharrlichkeit und Ausdauer führen oft sicherer zum Ziel als hochmütige Begabung ohne Fleiß.
</p>
`
  },
  {
    index: 2,
    id: 'loewe-und-maus',
    title: 'Der Löwe und das Mäuschen',
    html: `
<p><span class="reader-dropcap-letter">E</span>in mächtiger Löwe schlief am Mittag im kühlen Schatten eines Felsens. Ein kleines Mäuschen spielte unvorsichtig im Gras und lief aus Versehen über die Schnauze des schlafenden Raubtiers.</p>
<p>Der Löwe erwachte zornig, fuhr mit seiner gewaltigen Tatze aus und fing das zitternde Mäuschen. Er öffnete sein großes Maul, um es mit einem Bissen zu verschlingen.</p>
<p>»Ach, bitte, erhabener König der Tiere!«, flehte das arme Mäuschen mit winziger Stimme. »Verzeih mir meine Unachtsamkeit und schenke mir das Leben! Ich wollte deinen königlichen Schlaf nicht stören. Wenn du mich verschonst, werde ich dir vielleicht eines Tages dankbar sein und dir helfen.«</p>
<p>Der Löwe lachte laut über die Vorstellung, dass ein so winziges Wesen einem König helfen könnte. Aber weil er gut gelaunt war, öffnete er seine Pranke und ließ das Mäuschen ungeschoren laufen.</p>
<p>Kurze Zeit später geriet der Löwe im dichten Dschungel in das Netz von Jägern. Verzweifelt bäumte er sich auf und brüllte so furchterregend, dass der ganze Wald erzitterte. Doch die starken Hanfseile gaben nicht nach.</p>
<p>Das kleine Mäuschen hörte das traurige Gebrüll aus der Ferne und erkannte sogleich die Stimme seines Retters. Es rannte so schnell es konnte herbei. Als es den Löwen gefangen sah, begann es sofort mit seinen scharfen Zähnchen an den dicken Seilen zu nagen.</p>
<p>Unermüdlich biss es Masche für Masche durch, bis das Netz riss und der Löwe befreit ins Freie treten konnte.</p>
<p>»Siehst du«, sagte das Mäuschen glücklich, »damals hast du über mich gelacht. Nun siehst du, dass auch eine kleine Maus einem großen Löwen das Leben retten kann.«</p>
<p style="font-style: italic; color: var(--read-primary); margin-top: 1.5rem; border-left: 3px solid var(--read-primary); padding-left: 0.8rem;">
<strong>Moral:</strong> Kein Freund ist zu klein, um hilfreich zu sein. Güte wird früher oder später belohnt.
</p>
`
  },
  {
    index: 3,
    id: 'rabe-und-fuchs',
    title: 'Der Rabe und der Fuchs',
    html: `
<p><span class="reader-dropcap-letter">E</span>in Rabe hatte einem Bauern ein schönes, großes Stück Käse gestohlen. Stolz flog er auf den Ast einer hohen Eiche, um seinen köstlichen Fund in aller Ruhe zu verzehren.</p>
<p>Ein hungriger Fuchs, der vom Duft des frischen Käses angelockt wurde, schlich unter den Baum. Er sah den fetten Käse im Schnabel des Vogels und überlegte, wie er ihn bekommen könnte.</p>
<p>Da blickte der schlaue Fuchs bewundernd nach oben und schmeichelte mit süßer Stimme: »O Rabe, was für ein herrlicher Vogel du bist! Wie glänzen deine schwarzen Federn im Sonnenlicht wie reines Ebenholz! Wie stolz ist deine Haltung und wie scharf dein edler Blick!«</p>
<p>Der Rabe hörte das Schmeicheln mit großem Behagen und plusterte sein Gefieder auf.</p>
<p>Der Fuchs sprach weiter: »Gewiss ist deine Stimme ebenso unvergleichlich wie dein königliches Kleid! Wenn dein Gesang so süß ist wie deine Schönheit, dann bist du ohne Zweifel der wahre König aller Vögel! Ach, wenn ich doch nur einen einzigen Ton aus deiner lieblichen Kehle vernehmen dürfte!«</p>
<p>Der eitle Rabe konnte der Schmeichelei nicht widerstehen. Um dem Fuchs zu beweisen, dass auch seine Stimme meisterhaft war, sperrte er den Schnabel weit auf und schrie aus voller Kehle: »Krah! Krah!«</p>
<p>Im selben Augenblick fiel das schwere Stück Käse aus seinem offenen Schnabel kerzengerade in die Tiefe. Der Fuchs fing den Käse noch im Flug mit geschicktem Maule auf, schluckte ihn genüsslich hinunter und rief dem verdutzten Raben spöttisch zu:</p>
<p>»Mein lieber Rabe, an deiner Schönheit zweifle ich nicht. Aber an deinem Verstand fehlt es dir noch gewaltig! Merk dir fürs Leben: Glaube niemals einem Schmeichler!«</p>
<p style="font-style: italic; color: var(--read-primary); margin-top: 1.5rem; border-left: 3px solid var(--read-primary); padding-left: 0.8rem;">
<strong>Moral:</strong> Wer leichtsinnig auf Schmeichler hört, bezahlt seine Eitelkeit oft mit bitterem Schaden.
</p>
`
  },
  {
    index: 4,
    id: 'hirtenjunge-und-wolf',
    title: 'Der Hirtenjunge und der Wolf',
    html: `
<p><span class="reader-dropcap-letter">E</span>in junger Hirtenjunge hütete die Schafe seines Dorfes auf einer weiten Wiese am Rande eines tiefen Waldes. Die Tage waren lang, und der Junge langweilte sich oft ganz furchtbar.</p>
<p>Eines Nachmittags kam ihm ein boshafter Einfall, um sich die Zeit zu vertreiben. Er rannte schreiend auf das Dorf zu, fuchtelte mit den Armen und rief aus Leibeskräften: »Hilfe! Hilfe! Der Wolf! Der Wolf kommt und frisst die Schafe!«</p>
<p>Die gutmütigen Dorfbewohner ließen sofort ihre Arbeit auf den Feldern und in den Werkstätten liegen, griffen nach Äxten, Mistgabeln und Knüppeln und eilten auf die Wiese, um dem Jungen und seiner Herde beizustehen.</p>
<p>Als sie keuchend ankamen, saß der Hirtenjunge im Gras und lachte sich ins Fäustchen: »Haha! Ich habe euch nur zum Narren gehalten! Hier ist gar kein Wolf!« Die Dorfleute schüttelten verärgert die Köpfe und gingen murrend wieder an ihre Arbeit.</p>
<p>Einige Tage später wiederholte der freche Junge denselben bösen Streich. Wieder schrie er aus vollem Halse: »Der Wolf! Zu Hilfe, der Wolf ist da!« Und wieder eilten die besorgten Dorfbewohner herbei, nur um erneut vom Jungen ausgelacht zu werden.</p>
<p>Doch am Abend darauf brach tatsächlich ein riesiger, hungriger Wolf aus dem dichten Unterholz hervor und stürzte sich auf die friedliche Schafherde. Zu Tode erschrocken sprang der Junge auf und schrie verzweifelt:</p>
<p>»Hilfe! Zu Hilfe! Diesmal ist es die Wahrheit! Der Wolf ist wirklich da! Bitte helft mir!«</p>
<p>Die Dorfbewohner im Dorf hörten sein Rufen wohl, aber sie sahen einander an und sagten: »Der Lügenbold will uns schon wieder an der Nase herumführen. Niemand geht hin.«</p>
<p>So half dem Jungen niemand. Der Wolf riss viele Schafe und vertrieb die übrige Herde in alle Winde. Weinend saß der unglückliche Junge am Abend allein auf der leeren Wiese und bereute seine Lügen bitterlich.</p>
<p style="font-style: italic; color: var(--read-primary); margin-top: 1.5rem; border-left: 3px solid var(--read-primary); padding-left: 0.8rem;">
<strong>Moral:</strong> Einem Lügner glaubt man nicht, selbst wenn er einmal die Wahrheit spricht.
</p>
`
  }
];

const fabelnBook = {
  id: 'deutsche-fabeln',
  title: 'Klassische Tierfabeln',
  author: 'Äsop & Martin Luther',
  year: '1530',
  language: 'de',
  languageFlag: '🇩🇪',
  languageName: 'German',
  targetLanguage: 'en',
  featured: true,
  difficulty: 'Beginner (A1)',
  difficultyLevel: 'beginner',
  genre: 'Classic Fables & Wisdom',
  chaptersCount: fabelnChapters.length,
  cover: '',
  description: 'Short, delightful animal fables with clear vocabulary and timeless morals. Perfect for absolute beginners starting their German reading journey.',
  gutenbergUrl: '',
  chapters: fabelnChapters
};

fs.writeFileSync('./assets/books/deutsche-fabeln.json', JSON.stringify(fabelnBook, null, 2));
console.log('Saved deutsche-fabeln.json with', fabelnChapters.length, 'chapters.');

// -----------------------------------------------------------------------------
// 3. Alltagsgeschichten für Anfänger (A1 Daily Life Stories)
// -----------------------------------------------------------------------------
const alltagsChapters = [
  {
    index: 0,
    id: 'morgen-im-cafe',
    title: 'Ein sonniger Morgen im Café',
    html: `
<p><span class="reader-dropcap-letter">E</span>s ist Samstagmorgen in Berlin. Die Sonne scheint warm am blauen Himmel, und die Vögel singen in den grünen Lindenbäumen. Lukas wacht früh auf, öffnet das Fenster und atmet die frische Morgenluft ein.</p>
<p>»Heute ist ein wunderbarer Tag für einen Spaziergang«, denkt Lukas fröhlich. Er zieht ein bequemes T-Shirt und seine Lieblingsjeans an und verlässt die Wohnung. Die Straßen sind noch ruhig. Nur ein paar Leute gehen mit ihren Hunden spazieren.</p>
<p>An der Ecke zur Bergstraße duftet es herrlich nach frischem Brot und geröstetem Kaffee. Lukas betritt das gemütliche »Café Sonnenschein«. Hinter der Theke steht Maria, die freundliche Kellnerin mit den braunen Locken.</p>
<p>»Guten Morgen, Lukas!«, grüßt Maria mit einem warmen Lächeln. »Schön, dich zu sehen. Wie geht es dir heute?« »Guten Morgen, Maria! Mir geht es blendend, danke. Das Wetter ist einfach fantastisch.«</p>
<p>»Was darf ich dir heute bringen?«, fragt Maria und nimmt ihren Notizblock zur Hand. Lukas schaut auf die Kreidetafel an der Wand: »Ich hätte gern einen großen Cappuccino mit Hafermilch und ein warmes Schokoladencroissant, bitte.«</p>
<p>»Sehr gern! Nimm doch draußen auf der Terrasse Platz, die Sonne ist herrlich.« Lukas setzt sich an einen kleinen runden Tisch unter einem roten Sonnenschirm. Er nimmt sein neues Buch aus der Tasche und beginnt zu lesen.</p>
<p>Wenige Minuten später bringt Maria den dampfenden Kaffee und das knusprige Gebäck. »Lass es dir schmecken!«, sagt sie. Der Kaffee schmeckt cremig und sanft, und die Schokolade schmilzt auf der Zunge. Lukas schließt für einen kurzen Augenblick glücklich die Augen. So schön kann ein Samstag beginnen!</p>
`
  },
  {
    index: 1,
    id: 'tag-in-muenchen',
    title: 'Ein Tag in München',
    html: `
<p><span class="reader-dropcap-letter">E</span>mma besucht zum allerersten Mal die Stadt München in Bayern. Sie steigt am Hauptbahnhof aus dem Zug und blickt neugierig umher. Überall eilen Menschen mit Koffern und Rucksäcken vorbei.</p>
<p>Emma holt einen bunten Stadtplan aus ihrem Rucksack. Ihr erstes Ziel ist der berühmte Marienplatz im Herzen der Altstadt. Nach einem kurzen Fußweg durch die Fußgängerzone steht sie vor dem beeindruckenden Neuen Rathaus mit seinem hohen Turm.</p>
<p>Plötzlich beginnt Musik zu spielen! Es ist genau elf Uhr vormittags, und das berühmte Glockenspiel erwacht zum Leben. Bunte Figuren aus Holz drehen sich im Turm im Kreis und tanzen zu fröhlichen Melodien. Hunderte von Touristen bleiben stehen, staunen und machen Fotos mit ihren Kameras.</p>
<p>Nach dem Glockenspiel bekommt Emma großen Appetit. Nur wenige Schritte entfernt liegt der lebhafte Viktualienmarkt. An den vielen Marktständen gibt es frisches Obst, bunte Blumen, duftenden Käse und frische Brezeln.</p>
<p>Emma kauft sich eine ofenfrische, knusprige Brezel mit feinem Meersalz und einen süßen Apfel. Sie setzt sich auf eine Holzbank im Schatten eines alten Kastanienbaums und beobachtet das bunte Treiben der Stadt. »München gefällt mir wirklich sehr«, murmelt sie zufrieden vor sich hin.</p>
`
  },
  {
    index: 2,
    id: 'geheimnis-bibliothek',
    title: 'Das Geheimnis der alten Bibliothek',
    html: `
<p><span class="reader-dropcap-letter">A</span>n einem regnerischen Dienstagnachmittag sucht Felix Schutz vor dem Gewitter. Er rennt die Steintreppe hinauf und betritt die alte Stadtbibliothek. Schwere Holztüren schließen sich hinter ihm, und sofort umgibt ihn eine tiefe, beruhigende Stille.</p>
<p>Die Bibliothek riecht nach altem Papier, Leder und Bienenwachs. Riesige Regale reichen bis unter die hohe Decke und sind voller tausender Bücher. Felix schlendert durch die stillen Gänge und lässt die Fingerspitzen über die Buchrücken gleiten.</p>
<p>Ganz hinten in einer dunklen Ecke fällt sein Blick auf ein Buch mit einem dunkelroten Samteinband und einer goldenen Schließe. Neugierig zieht er es vorsichtig aus dem Regal. Auf dem Einband steht in geschwungenen goldenen Buchstaben: »Geschichten aus vergangenen Zeiten«.</p>
<p>Als Felix das Buch öffnet, flattert ein kleiner, vergilbter Zettel heraus und segelt lautlos zu Boden. Felix bückt sich und hebt ihn auf. Auf dem Papier steht eine handgeschriebene Nachricht in feiner Tinte:</p>
<p style="font-family: serif; font-style: italic; background: rgba(245, 158, 11, 0.1); border: 1px dashed var(--read-gold); padding: 0.8rem; border-radius: 8px; margin: 1rem 0;">
»Dem aufmerksamen Leser, der dieses Buch öffnet: Suche hinter dem dritten Band der Weltgeschichte im Regal Nummer sieben nach dem Schlüssel zum Garten der Träume.«
</p>
<p>Felix' Herz beginnt vor Aufregung schneller zu schlagen. Ist das ein altes Lesezeichen oder der Beginn eines echten Abenteuers? Er lächelt geheimnisvoll und macht sich auf die Suche nach Regal Nummer sieben...</p>
`
  }
];

const alltagsBook = {
  id: 'alltagsgeschichten',
  title: 'Einfache Alltagsgeschichten',
  author: 'Moderne Lesetexte',
  year: '2026',
  language: 'de',
  languageFlag: '🇩🇪',
  languageName: 'German',
  targetLanguage: 'en',
  featured: false,
  difficulty: 'Beginner (A1)',
  difficultyLevel: 'beginner',
  genre: 'Everyday Life & Dialogues',
  chaptersCount: alltagsChapters.length,
  cover: '',
  description: 'Relaxed, everyday short stories packed with high-frequency German words, daily dialogue, café ordering, and city life. Ideal for first-time German learners.',
  gutenbergUrl: '',
  chapters: alltagsChapters
};

fs.writeFileSync('./assets/books/alltagsgeschichten.json', JSON.stringify(alltagsBook, null, 2));
console.log('Saved alltagsgeschichten.json with', alltagsChapters.length, 'chapters.');

// -----------------------------------------------------------------------------
// 4. Update Library Manifest
// -----------------------------------------------------------------------------
const currentManifest = JSON.parse(fs.readFileSync('./assets/books/manifest.json', 'utf8'));

// Build new manifest with clear categories and beginner-friendly books first
const newManifest = [
  // 🟢 Beginner German Books First!
  {
    id: 'grimms-maerchen',
    title: 'Märchen der Brüder Grimm',
    author: 'Jacob & Wilhelm Grimm',
    year: '1812',
    language: 'de',
    languageFlag: '🇩🇪',
    languageName: 'German',
    targetLanguage: 'en',
    featured: true,
    difficulty: 'Beginner (A1-A2)',
    difficultyLevel: 'beginner',
    genre: 'Fairy Tales & Legends',
    chaptersCount: grimmsChapters.length,
    cover: '',
    description: 'Rotkäppchen, Hänsel und Gretel, Dornröschen, and Die Bremer Stadtmusikanten rewritten in clear, accessible German for language learners.'
  },
  {
    id: 'deutsche-fabeln',
    title: 'Klassische Tierfabeln',
    author: 'Äsop & Martin Luther',
    year: '1530',
    language: 'de',
    languageFlag: '🇩🇪',
    languageName: 'German',
    targetLanguage: 'en',
    featured: true,
    difficulty: 'Beginner (A1)',
    difficultyLevel: 'beginner',
    genre: 'Fables & Wisdom',
    chaptersCount: fabelnChapters.length,
    cover: '',
    description: 'Ultra-short animal fables with clear vocabulary and timeless morals: The Fox and the Grapes, The Tortoise and the Hare, and The Lion and the Mouse.'
  },
  {
    id: 'alltagsgeschichten',
    title: 'Einfache Alltagsgeschichten',
    author: 'Moderne Lesetexte',
    year: '2026',
    language: 'de',
    languageFlag: '🇩🇪',
    languageName: 'German',
    targetLanguage: 'en',
    featured: false,
    difficulty: 'Beginner (A1)',
    difficultyLevel: 'beginner',
    genre: 'Daily Life & Modern',
    chaptersCount: alltagsChapters.length,
    cover: '',
    description: 'Everyday short stories packed with high-frequency German words, café dialogues, and relatable daily life in Berlin and Munich.'
  },
  // Primary Gutenberg book requested by user
  {
    id: 'japanische-maerchen',
    title: 'Japanische Märchen',
    author: 'Karl Alberti',
    year: '1913',
    language: 'de',
    languageFlag: '🇩🇪',
    languageName: 'German',
    targetLanguage: 'en',
    featured: true,
    difficulty: 'Intermediate (B1)',
    difficultyLevel: 'intermediate',
    genre: 'Fairy Tales & Legends',
    chaptersCount: 24,
    cover: 'assets/books/japanische-maerchen/OEBPS/3761235858305626459_cover_light_sm.jpg',
    description: 'Enchanting Japanese folk tales translated into German with authentic woodcut illustrations (Project Gutenberg #23393).'
  },
  // Advanced German
  {
    id: 'die-verwandlung',
    title: 'Die Verwandlung',
    author: 'Franz Kafka',
    year: '1915',
    language: 'de',
    languageFlag: '🇩🇪',
    languageName: 'German',
    targetLanguage: 'en',
    featured: false,
    difficulty: 'Advanced (B2-C1)',
    difficultyLevel: 'advanced',
    genre: 'Modernist Fiction',
    chaptersCount: 3,
    cover: '',
    description: 'Gregor Samsa wakes up transformed into an insect. A towering masterpiece of 20th-century literature.'
  },
  // French
  {
    id: 'le-tour-du-monde',
    title: 'Le Tour du monde en 80 jours',
    author: 'Jules Verne',
    year: '1873',
    language: 'fr',
    languageFlag: '🇫🇷',
    languageName: 'French',
    targetLanguage: 'en',
    featured: false,
    difficulty: 'Intermediate (B1)',
    difficultyLevel: 'intermediate',
    genre: 'Classic Adventure',
    chaptersCount: 10,
    cover: '',
    description: 'Phileas Fogg and Passepartout embark on their world-famous wager across steamships and railways.'
  },
  // Spanish
  {
    id: 'don-quijote',
    title: 'Don Quijote de la Mancha',
    author: 'Miguel de Cervantes',
    year: '1605',
    language: 'es',
    languageFlag: '🇪🇸',
    languageName: 'Spanish',
    targetLanguage: 'en',
    featured: false,
    difficulty: 'Upper Intermediate (B2)',
    difficultyLevel: 'intermediate',
    genre: 'Epic Chivalry',
    chaptersCount: 8,
    cover: '',
    description: 'The monumental Spanish classic following the adventures of Alonso Quijano and his squire Sancho Panza.'
  }
];

fs.writeFileSync('./assets/books/manifest.json', JSON.stringify(newManifest, null, 2));
console.log('Updated manifest.json with beginner-friendly books.');

// -----------------------------------------------------------------------------
// 5. Expand Common Dictionary for Beginner Vocabulary
// -----------------------------------------------------------------------------
const currentDict = JSON.parse(fs.readFileSync('./assets/books/common-dict.json', 'utf8'));

const additionalVocab = {
  // Rotkäppchen & Grimm vocabulary
  "rotkäppchen": { t: "Little Red Riding Hood", pos: "noun" },
  "hänsel": { t: "Hansel", pos: "noun" },
  "gretel": { t: "Gretel", pos: "noun" },
  "dornröschen": { t: "Sleeping Beauty", pos: "noun" },
  "froschkönig": { t: "Frog Prince / Frog King", pos: "noun" },
  "frosch": { t: "frog", pos: "noun" },
  "kuchen": { t: "cake", pos: "noun" },
  "wein": { t: "wine", pos: "noun" },
  "flasche": { t: "bottle", pos: "noun" },
  "großmutter": { t: "grandmother", pos: "noun" },
  "großvater": { t: "grandfather", pos: "noun" },
  "wolf": { t: "wolf", pos: "noun" },
  "wölfe": { t: "wolves", pos: "noun" },
  "jäger": { t: "hunter", pos: "noun" },
  "blumen": { t: "flowers", pos: "noun" },
  "blume": { t: "flower", pos: "noun" },
  "ohren": { t: "ears", pos: "noun" },
  "ohr": { t: "ear", pos: "noun" },
  "augen": { t: "eyes", pos: "noun" },
  "auge": { t: "eye", pos: "noun" },
  "hände": { t: "hands", pos: "noun" },
  "hand": { t: "hand", pos: "noun" },
  "maul": { t: "mouth / jaws (of an animal)", pos: "noun" },
  "mund": { t: "mouth", pos: "noun" },
  "brot": { t: "bread", pos: "noun" },
  "brötchen": { t: "bread roll", pos: "noun" },
  "steine": { t: "stones", pos: "noun" },
  "stein": { t: "stone / rock", pos: "noun" },
  "schere": { t: "scissors", pos: "noun" },
  "bauch": { t: "belly / stomach", pos: "noun" },
  "bett": { t: "bed", pos: "noun" },
  "ofen": { t: "oven / stove", pos: "noun" },
  "kieselsteine": { t: "pebbles", pos: "noun" },
  "häuschen": { t: "cottage / little house", pos: "noun" },
  "hexe": { t: "witch", pos: "noun" },
  "zucker": { t: "sugar", pos: "noun" },
  "spindel": { t: "spindle", pos: "noun" },
  "kugel": { t: "ball / sphere", pos: "noun" },
  "goldene": { t: "golden", pos: "adjective" },
  "gold": { t: "gold", pos: "noun" },
  "brunnen": { t: "well / fountain", pos: "noun" },
  "königstochter": { t: "king's daughter / princess", pos: "noun" },
  "prinzessin": { t: "princess", pos: "noun" },
  "könig": { t: "king", pos: "noun" },
  "königin": { t: "queen", pos: "noun" },
  "schloss": { t: "castle / palace", pos: "noun" },
  "turm": { t: "tower", pos: "noun" },
  "esel": { t: "donkey / ass", pos: "noun" },
  "hund": { t: "dog", pos: "noun" },
  "katze": { t: "cat", pos: "noun" },
  "hahn": { t: "rooster / cock", pos: "noun" },
  "huhn": { t: "chicken / hen", pos: "noun" },
  "räuber": { t: "robber / thief", pos: "noun" },
  "musikant": { t: "musician", pos: "noun" },
  "musik": { t: "music", pos: "noun" },
  "bremen": { t: "Bremen (German city)", pos: "noun" },

  // Fables vocabulary
  "fuchs": { t: "fox", pos: "noun" },
  "trauben": { t: "grapes", pos: "noun" },
  "weintrauben": { t: "grapes", pos: "noun" },
  "sauer": { t: "sour / angry", pos: "adjective" },
  "süß": { t: "sweet / cute", pos: "adjective" },
  "reif": { t: "ripe / mature", pos: "adjective" },
  "unreif": { t: "unripe", pos: "adjective" },
  "schildkröte": { t: "turtle / tortoise", pos: "noun" },
  "hase": { t: "hare / rabbit", pos: "noun" },
  "rennen": { t: "race / to run", pos: "noun" },
  "schnell": { t: "fast / quick", pos: "adjective" },
  "langsam": { t: "slow / slowly", pos: "adjective" },
  "löwe": { t: "lion", pos: "noun" },
  "maus": { t: "mouse", pos: "noun" },
  "mäuschen": { t: "little mouse", pos: "noun" },
  "netz": { t: "net", pos: "noun" },
  "seil": { t: "rope / cord", pos: "noun" },
  "käse": { t: "cheese", pos: "noun" },
  "schnabel": { t: "beak / bill", pos: "noun" },
  "eitel": { t: "vain / conceited", pos: "adjective" },
  "schmeichler": { t: "flatterer", pos: "noun" },
  "hirte": { t: "shepherd", pos: "noun" },
  "hirtenjunge": { t: "shepherd boy", pos: "noun" },
  "schafe": { t: "sheep", pos: "noun" },
  "schaf": { t: "sheep", pos: "noun" },
  "lüge": { t: "lie / falsehood", pos: "noun" },
  "wahrheit": { t: "truth", pos: "noun" },
  "hilfe": { t: "help", pos: "noun" },

  // Daily life vocabulary
  "kaffee": { t: "coffee", pos: "noun" },
  "cappuccino": { t: "cappuccino", pos: "noun" },
  "milch": { t: "milk", pos: "noun" },
  "croissant": { t: "croissant", pos: "noun" },
  "schokolade": { t: "chocolate", pos: "noun" },
  "apfel": { t: "apple", pos: "noun" },
  "brezel": { t: "pretzel", pos: "noun" },
  "kellnerin": { t: "waitress", pos: "noun" },
  "kellner": { t: "waiter", pos: "noun" },
  "tisch": { t: "table", pos: "noun" },
  "stuhl": { t: "chair", pos: "noun" },
  "bibliothek": { t: "library", pos: "noun" },
  "buch": { t: "book", pos: "noun" },
  "bücher": { t: "books", pos: "noun" },
  "morgen": { t: "morning / tomorrow", pos: "noun" },
  "wetter": { t: "weather", pos: "noun" },
  "sonne": { t: "sun", pos: "noun" },
  "regen": { t: "rain", pos: "noun" },
  "freude": { t: "joy / pleasure", pos: "noun" },
  "abenteuer": { t: "adventure", pos: "noun" }
};

const mergedDict = Object.assign({}, currentDict, additionalVocab);
fs.writeFileSync('./assets/books/common-dict.json', JSON.stringify(mergedDict, null, 2));
console.log('Expanded common dictionary to', Object.keys(mergedDict).length, 'entries.');

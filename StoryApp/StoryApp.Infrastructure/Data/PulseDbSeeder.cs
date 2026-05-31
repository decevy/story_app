using StoryApp.Core.Entities;
using Microsoft.EntityFrameworkCore;

namespace StoryApp.Infrastructure.Data;

public static class PulseDbSeeder
{
    public static async Task SeedAsync(PulseDbContext context, CancellationToken cancellationToken = default)
    {
        if (await context.Users.AnyAsync(cancellationToken))
            return;

        var users = new List<User>
        {
            new User
            {
                Username = "aya",
                Email = "aya@test.com",
                PasswordHash = BCrypt.Net.BCrypt.HashPassword("test123"),
                IsOnline = false,
                CreatedAt = DateTime.UtcNow,
                LastSeen = DateTime.UtcNow
            },
            new User
            {
                Username = "bobby",
                Email = "bobby@test.com",
                PasswordHash = BCrypt.Net.BCrypt.HashPassword("test123"),
                IsOnline = false,
                CreatedAt = DateTime.UtcNow,
                LastSeen = DateTime.UtcNow
            },
            new User
            {
                Username = "carlos",
                Email = "carlos@test.com",
                PasswordHash = BCrypt.Net.BCrypt.HashPassword("test123"),
                IsOnline = false,
                CreatedAt = DateTime.UtcNow,
                LastSeen = DateTime.UtcNow
            }
        };

        await context.Users.AddRangeAsync(users, cancellationToken);
        await context.SaveChangesAsync(cancellationToken);
        context.ChangeTracker.Clear();

        var pulses = new List<Pulse>
        {
            new Pulse
            {
                Name = "Het Neon-Noedel Bijpand",
                Description =
                    "Volksvertelsels rond een retro-brandstoffen-diner bij de tramhalte in de asteroïdengordel.",
                IsPrivate = false,
                CreatedBy = users[0].Id,
                CreatedAt = DateTime.UtcNow
            },
            new Pulse
            {
                Name = "Logboek van de stormglaswaker",
                Description =
                    "Met de hand geschreven vuurtorennotities uit het seizoen waarin het getijdewater stout deed.",
                IsPrivate = false,
                CreatedBy = users[1].Id,
                CreatedAt = DateTime.UtcNow
            },
            new Pulse
            {
                Name = "De envelop met de koperen sleutel",
                Description =
                    "Twee nichten annoteren een brozes briefje achter een afbladderende ladenkast met kantteksten.",
                IsPrivate = true,
                CreatedBy = users[0].Id,
                CreatedAt = DateTime.UtcNow
            }
        };

        await context.Pulses.AddRangeAsync(pulses, cancellationToken);
        await context.SaveChangesAsync(cancellationToken);
        context.ChangeTracker.Clear();

        var aya = users[0].Id;
        var bobby = users[1].Id;
        var carlos = users[2].Id;

        // Pulse 0: aya + bobby; Pulse 1: bobby + carlos; Pulse 2: aya + carlos.
        var pacers = new List<Pacer>
        {
            new Pacer { UserId = aya, PulseId = pulses[0].Id, JoinedAt = DateTime.UtcNow },
            new Pacer { UserId = bobby, PulseId = pulses[0].Id, JoinedAt = DateTime.UtcNow },

            new Pacer { UserId = bobby, PulseId = pulses[1].Id, JoinedAt = DateTime.UtcNow },
            new Pacer { UserId = carlos, PulseId = pulses[1].Id, JoinedAt = DateTime.UtcNow },

            new Pacer { UserId = aya, PulseId = pulses[2].Id, JoinedAt = DateTime.UtcNow },
            new Pacer { UserId = carlos, PulseId = pulses[2].Id, JoinedAt = DateTime.UtcNow }
        };

        await context.Pacers.AddRangeAsync(pacers, cancellationToken);
        await context.SaveChangesAsync(cancellationToken);
        context.ChangeTracker.Clear();

        static List<Beat> BuildRoundRobinPulse(
            int pulseId,
            int firstUserId,
            int secondUserId,
            IReadOnlyList<string> passagesInOrder,
            int startMinuteOffsetInclusive,
            int endMinuteOffsetInclusive)
        {
            var beats = new List<Beat>(passagesInOrder.Count);
            var stepCount = passagesInOrder.Count - 1;
            if (stepCount < 0)
                return beats;

            for (var i = 0; i < passagesInOrder.Count; i++)
            {
                var t = stepCount == 0
                    ? endMinuteOffsetInclusive
                    : startMinuteOffsetInclusive
                      + (endMinuteOffsetInclusive - startMinuteOffsetInclusive) * i / stepCount;

                beats.Add(new Beat
                {
                    Passage = passagesInOrder[i],
                    UserId = i % 2 == 0 ? firstUserId : secondUserId,
                    PulseId = pulseId,
                    CreatedAt = DateTime.UtcNow.AddMinutes(t)
                });
            }

            return beats;
        }

        var neonAnnexPassages = new[]
        {
            "De laminaire afvoerroosters boven hok zeven fluisterden akkoorden die ik zweer nog te kennen van aardse snelwegen.",
            "Buiten lakte een plasmamotregen het glas van de aanmeerslurf met goedkoop-kermisschitterstrepen.",
            "Onze serveerster schoof twee kommen naar voren waarop meteoriet-roetbouillon stond, zonder te knipperen achter haar chroom-brilvizier.",
            "De bouillon rook naar onweer en weigerde beleefd af te koelen.",
            "Een geplastificeerde kaart beloofde dat de servetten uit biologisch afbreekbare sterrenstof waren; het mijne loste op tot nette rook.",
            "De jukebox draaide alleen baan-verkeerswaarschuwingen vermengd met salsarhythmes.",
            "Drie hokjes verder bekvechten twee mensen tolbruggen tussen Lagrangepaarkeervelden.",
            "De frietjes arriveerden nog orbitend in hun mand als een suf trage micrograviteitswiebel.",
            "Ik schreef het bestelnummer toch maar op mijn pols bijgeloof uit oude grensweg-dinerstreken.",
            "Hij lachte en zei dat zulke zaakjes leefden van sentimenteel vrachtpersoneel dat regengeluid miste.",
            "De juslepel droeg een gescratcht rompnummer dat overeenkwam met een berging uit het stormravagejaar.",
            "We deden of we het niet merkten en gaven het lepel voor lepel alsof een gerucht herschrijven veiliger maakte.",
            "Bij het bijvul-karretje smaakte gerecycleerde thee naar koelmedium en muntheling.",
            "Hij bekende dat hij ruimtevoer haten zou als plekken als deze zich niet overdreven melodramatisch verkochten.",
            "Ik wees naar het raam waar een dronekoort lampionnen voorbijdroeg langs de silhouetspar.",
            "Hij zei dat lampionnen elke lucht geleend lieten voelen, zelfs als je er eeuwig onder woonde.",
            "De neondraak boven de kassa flikkerde als een zware vrachtklopper de ligplaats-sloten deed trillen.",
            "Misschien voelde het neon hoe onze harten aan diezelfde kleine sympathische sprong deelnamen.",
            "We deelden een toetje waar orbit crumble op stond tot de korrels zijwaarts dreven als verkeerd gerichte sneeuw.",
            "Het kruim bleef hangen aan mouwen én aan verhalen die we later zouden polijsten.",
            "Een omroep telde de afstand tot de dockingklamp af; precies bij nul zoogden de vorken mee.",
            "We betaalden met noten gefixeerd door zegels uit drie admiraliteitscirkels.",
            "Buiten perlde condens tegen de luikpakking als parels die voor ons verboden waren.",
            "Hij trok zijn kraag scheef schots—precies genoeg verzet voor een dinertje dat gedijt op beschaafde chaos."
        };

        var keeperLogPassages = new[]
        {
            "Het logboek begint bij schijnschemer omdat de vuurtorenklok 's nachts elf koppige minuten heeft gewonnen.",
            "Zout korstte langs de reliëfkaart op het reling als handschrift waar alleen de wind een punt onder kon zetten.",
            "Het glas van de lampenkamer droeg een violette waas die geen sop volledig durfde toe te geven.",
            "Radar tikte spokenbanken aan telkens wanneer de getijdebalk twee klanken in plaats van drie sloeg.",
            "Thee smaakte naar jodiumtrouw en naar een fluitketel waarvan de damp de vensterbank niet vrij wilde geven.",
            "Meeuwen cirkelden scherper dan de rekenkunst tijdens zo'n kalme deining zou toe moeten laten.",
            "De misthoorn hakte halverwege een ademteug een halve lettergreep af — redelijk kattenkruid om in rood in te vullen.",
            "Verfafschilfers van de weduwe-galerij vielen een keer omhoog en dreven naar de lantaarnlichting als gedesoriënteerd sneeuw.",
            "Op het pakbonnetje bij de vrachtkrat stonden reservelampen én tussen haakjes optionele moed, met klein krullend schrift geschreven.",
            "We lachten één keer, broos en voorzichtig, en staplesten blikken alsof we horizon konden afsluiten met blikwerk.",
            "Midden in de nacht zag ik het vuurtorenlog zwellen door getijden die piekten vóór de maan haar gezicht liet zien.",
            "We klemden gedroogde bloemen tussen pagina's dertien en veerteen tot het papier rook naar hooi en gekantelde weiden.",
            "De marifoonpraat meldde een koor van boeien dat vragen beantwoordde die niemand op het land hardop had gesteld.",
            "De donder kwam vroeger dan gepland, naar roestige scharnieren smaakte en beleefd geleende afstand meebracht.",
            "We dichtsplankten de luiken toch maar en lieten de bouten kloppen op een ritme dat grootmoeder floten zou.",
            "Door de spleet tekende het bliksemlicht vluchtige zeekaarten die zich vouwden nog vóór we ze konden onthouden.",
            "De ketel gilde verraad toen koude motregel de schoorsteen in één grove band naar beneden sloeg.",
            "We vingen het met een emmer en noemden de meting liever wetenschap dan uitputting.",
            "Bij het keren van het tij vulden voetafdrukken op het voorplatform zich met luminescerend planktonapplaus.",
            "We stonden doodstil tot het applaus verdunt tot gewone onschuldige golfschuim.",
            "De lampmotor bromde een vowelkonstante alsof felheid ook werk is waar je voor tekent.",
            "We sloten af met initialen verknoeid door pekel nog leesbaar voor de volgende sceptische lezer.",
            "Die ochtend bekvechten meeuwen om touwslagschaduwen op het gebroken steen van het voordek.",
            "We draaiden aan de kompasroos-ring tot hij het noorden weer beleefd wenste voor te geven waar het niets meer uitmaakte.",
        };

        var copperKeyPassages = new[]
        {
            "De brosse envelop rook naar mottenvlerken en violet inktwerk dat zich niet wenste te verontschuldigen voor het bleken.",
            "Binnen krulde de eerste regel zich als een handschrift dat een bekentenis nog moest nakomen.",
            "De met pleister geplakte koperen sleutel liet een halovlek die leek op iemand zijn adem inhoudend.",
            "Stofmite reden de zolderzonnestraal rakelings door dat lichtcircuit alsof ze onze zenuwen peilden.",
            "Ze las hardop waar 'na de rijping van peren' stond en de zinsnede bleef steken in de keel van de verwarming.",
            "Ik vertaalde zwijgen naar schattingen over boomgaarden waar we alleen maar rommelige geruchtenpostcards van kenden.",
            "Een randnoot meldde een dinsdag blauwgeverfde brug puur bijgeloof waar niemand ooit controle op heeft kunnen houden.",
            "Plooirimpsels tekenden een patroon dat weerklonk met het platte grindpad langs de kas van nicht tante.",
            "Inktvlekken deden zich voor als vingerafdrukken die grootte door namiddaglucht wisselden.",
            "Op millimeterpapier streepte ik tegenstrijdigheden om tot gevlochten haarlijnen te komen.",
            "Het tweede stuk tekst smeekt de vindster om niet te vertrouwen op slotenmakerij die vals fluit.",
            "We oefenden excuses voor voorraadwerk dat deze geheimenis het langst bewaakt had.",
            "Hij volgde een inkteveeg tot die hem deed denken aan kustlijnen op afgeknepen ansichtkaarten.",
            "Een nabericht zinspeelde dat een biscuitblik in de schuur rammelde voller dan enig recept er recht op had.",
            "We betwisten of vriendelijkheid te lamineren valt zoals dinerkaarten tegen vet bestand moeten zijn.",
            "Een geplet viooltje zwierde zich los en tolde nog één rondje eer het haaks op gezonde verstand viel.",
            "Pagina drie citeerde een procureur berucht om zaken kwijt te raken aan vogelnests in gerechtsgevelgoten.",
            "Ik vroeg mij af of pennenwerk verval bespoedigt wanneer het zich ergens bij schaamt uit eerlijkheid.",
            "Een kiertje langs de enveloprug liet geselafdraad uit schortkoord zien gekleurd met indigo.",
            "We legden de koperen sleutel toch op de radiator alsof ijzer te vermurwen viel tegen koperen koppigheid.",
            "De verwarming sloot met een zacht geratel en een halve schouder op—alsof dingen zich herinnerden dat ze eens zo vast werden vastgepakt.",
            "Ze overschreef broze pennenstrepen naar grafiet terwijl ik voorzichtige datums tussen de randen noteerde.",
            "We vonden dat een brief achterstevoren vouwen de zolder dicht tegen naderende roddel langs de kraakjes.",
            "Halverwege de trappedaling zong oude ijzerwerk een liedje naar zomers die wij elkaar nooit deelden.",
        };

        var beats = new List<Beat>();
        beats.AddRange(BuildRoundRobinPulse(pulses[0].Id, aya, bobby, neonAnnexPassages, -132, -90));
        beats.AddRange(BuildRoundRobinPulse(pulses[1].Id, bobby, carlos, keeperLogPassages, -88, -46));
        beats.AddRange(BuildRoundRobinPulse(pulses[2].Id, aya, carlos, copperKeyPassages, -44, -2));

        await context.Beats.AddRangeAsync(beats, cancellationToken);
        await context.SaveChangesAsync(cancellationToken);
    }
}

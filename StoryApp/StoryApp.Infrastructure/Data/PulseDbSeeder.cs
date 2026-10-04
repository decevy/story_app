using StoryApp.Core.Entities;
using Microsoft.EntityFrameworkCore;

namespace StoryApp.Infrastructure.Data;

public static class PulseDbSeeder
{
    private readonly record struct SeedSegment(string Text, BeatTransition? TransitionAfter = null);

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
                Name = "De herberg aan de kruising",
                Description = "Twee reizigers stoppen waar de wegen samenkomen.",
                IsPrivate = false,
                CreatedBy = users[0].Id,
                CreatedAt = DateTime.UtcNow
            },
            new Pulse
            {
                Name = "Het licht op het eiland",
                Description = "Een wachter houdt het licht brandend terwijl de zee zwijgt.",
                IsPrivate = false,
                CreatedBy = users[1].Id,
                CreatedAt = DateTime.UtcNow
            },
            new Pulse
            {
                Name = "De brief en de sleutel",
                Description = "Twee nichten vinden op zolder een brief die op hen wachtte.",
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

        static List<BeatSegment> MapSegments(IReadOnlyList<SeedSegment> segments)
        {
            var mapped = new List<BeatSegment>(segments.Count);
            for (var i = 0; i < segments.Count; i++)
            {
                var seed = segments[i];
                mapped.Add(new BeatSegment
                {
                    Order = i,
                    Text = seed.Text,
                    TransitionAfter = seed.TransitionAfter
                });
            }

            return mapped;
        }

        static List<Beat> BuildRoundRobinPulse(
            int pulseId,
            int firstUserId,
            int secondUserId,
            SeedSegment[][] beatsInOrder,
            int startMinuteOffsetInclusive,
            int endMinuteOffsetInclusive)
        {
            var beats = new List<Beat>(beatsInOrder.Length);
            var stepCount = beatsInOrder.Length - 1;
            if (stepCount < 0)
                return beats;

            for (var i = 0; i < beatsInOrder.Length; i++)
            {
                var t = stepCount == 0
                    ? endMinuteOffsetInclusive
                    : startMinuteOffsetInclusive
                      + (endMinuteOffsetInclusive - startMinuteOffsetInclusive) * i / stepCount;

                beats.Add(new Beat
                {
                    Order = i,
                    UserId = i % 2 == 0 ? firstUserId : secondUserId,
                    PulseId = pulseId,
                    CreatedAt = DateTime.UtcNow.AddMinutes(t),
                    Segments = MapSegments(beatsInOrder[i])
                });
            }

            return beats;
        }

        SeedSegment[][] innBeats =
        [
            [
                new("We waren laat. ", BeatTransition.SameParagraph),
                new("De herberg stond waar twee wegen elkaar kruisten, en de deur stond open. ", BeatTransition.NewParagraph)
            ],
            [
                new("Binnen rook het naar brood. ", BeatTransition.SameParagraph),
                new("Een man veegde de vloer alsof hij de dag wilde sluiten zonder hem te vergeten. ", BeatTransition.NewParagraph)
            ],
            [
                new("Hij keek op. ", BeatTransition.SameParagraph),
                new("Wie honger heeft, mag blijven, zei hij. ", BeatTransition.NewParagraph)
            ],
            [
                new("We gingen zitten. ", BeatTransition.SameParagraph),
                new("Niemand vroeg waar we vandaan kwamen. ", BeatTransition.NewSection)
            ],
            [
                new("De soep was eenvoudig. ", BeatTransition.SameParagraph),
                new("Juist daarom smaakte ze naar iets wat ik lang had gemist. ", BeatTransition.NewParagraph)
            ],
            [
                new("Mijn vriend zei dat een reis begint op het moment dat je stopt met haasten. ", BeatTransition.NewParagraph)
            ],
            [
                new("Ik wilde zeggen dat we een schema hadden. ", BeatTransition.SameParagraph),
                new("De woorden bleven in mijn mond. ", BeatTransition.NewSection)
            ],
            [
                new("Buiten ging de wind liggen. ", BeatTransition.NewParagraph)
            ],
            [
                new("De waard zette een kaars op tafel. ", BeatTransition.SameParagraph),
                new("Hij zei dat licht niet van de kaars is, maar van degene die ernaar kijkt. ", BeatTransition.NewParagraph)
            ],
            [
                new("We aten in stilte. ", BeatTransition.SameParagraph),
                new("Stilte is ook een vorm van gezelschap. ", BeatTransition.NewParagraph)
            ],
            [
                new("Bij de deur zei hij: de weg kiest niet. ", BeatTransition.SameParagraph),
                new("Jij kiest of je hem volgt. ", BeatTransition.NewParagraph)
            ],
            [
                new("We betaalden met wat we hadden. ", BeatTransition.SameParagraph),
                new("Het was genoeg. ", BeatTransition.NewParagraph)
            ],
            [
                new("We liepen verder. ", BeatTransition.SameParagraph),
                new("Achter ons bleef de lamp branden, klein en zeker. ")
            ]
        ];

        SeedSegment[][] lighthouseBeats =
        [
            [
                new("Ik schrijf dit bij het vallen van de avond. ", BeatTransition.NewParagraph)
            ],
            [
                new("De zee was rustig, en toch hoorde ik haar. ", BeatTransition.SameParagraph),
                new("Ze sprak niet in woorden. ", BeatTransition.NewParagraph)
            ],
            [
                new("Een oude man had me gezegd: bewaak het licht, niet de storm. ", BeatTransition.NewSection)
            ],
            [
                new("Ik poetste het glas tot ik mijn eigen gezicht zag. ", BeatTransition.NewParagraph)
            ],
            [
                new("In de nacht kwam de mist. ", BeatTransition.SameParagraph),
                new("Ik liet de lamp draaien, zoals ik had beloofd. ", BeatTransition.NewParagraph)
            ],
            [
                new("Een schip antwoordde met één flits. ", BeatTransition.SameParagraph),
                new("Dat was genoeg om niet alleen te zijn. ", BeatTransition.NewSection)
            ],
            [
                new("Bij dageraad lag zout op de reling. ", BeatTransition.NewParagraph)
            ],
            [
                new("Ik dacht aan de mensen op het land. ", BeatTransition.SameParagraph),
                new("Zij slapen terwijl iemand wakker blijft. ", BeatTransition.NewParagraph)
            ],
            [
                new("De meeuwen kwamen terug. ", BeatTransition.SameParagraph),
                new("Zij kennen de weg zonder kaart. ", BeatTransition.NewParagraph)
            ],
            [
                new("Ik sloot het logboek. ", BeatTransition.SameParagraph),
                new("Wat telt, staat niet altijd op papier. ")
            ]
        ];

        SeedSegment[][] letterBeats =
        [
            [
                new("Op zolder vonden we een envelop. ", BeatTransition.SameParagraph),
                new("Hij lag daar alsof hij op ons had gewacht. ", BeatTransition.NewParagraph)
            ],
            [
                new("Erin zat een brief, en een koperen sleutel. ", BeatTransition.NewParagraph)
            ],
            [
                new("Mijn nicht las de eerste regel hardop. ", BeatTransition.SameParagraph),
                new("Wie zoekt wat hij al heeft, vindt de deur niet. ", BeatTransition.NewSection)
            ],
            [
                new("We zwegen. ", BeatTransition.SameParagraph),
                new("Soms is stilte het enige eerlijke antwoord. ", BeatTransition.NewParagraph)
            ],
            [
                new("De sleutel was klein. ", BeatTransition.SameParagraph),
                new("Hij woog meer dan hij leek. ", BeatTransition.NewParagraph)
            ],
            [
                new("In de kantlijn stond: het hart is een slot dat opent als je ophoudt te forceren. ", BeatTransition.NewSection)
            ],
            [
                new("We daalden de trap af. ", BeatTransition.SameParagraph),
                new("Beneden rook het huis naar hout en naar thee. ", BeatTransition.NewParagraph)
            ],
            [
                new("Ze zei dat we de brief niet hoefden te begrijpen om hem te bewaren. ", BeatTransition.NewParagraph)
            ],
            [
                new("Ik legde de sleutel in mijn zak. ", BeatTransition.SameParagraph),
                new("Niet om een deur te openen, maar om te onthouden dat er één was. ")
            ]
        ];

        var beats = new List<Beat>();
        beats.AddRange(BuildRoundRobinPulse(pulses[0].Id, aya, bobby, innBeats, -132, -90));
        beats.AddRange(BuildRoundRobinPulse(pulses[1].Id, bobby, carlos, lighthouseBeats, -88, -46));
        beats.AddRange(BuildRoundRobinPulse(pulses[2].Id, aya, carlos, letterBeats, -44, -2));

        await context.Beats.AddRangeAsync(beats, cancellationToken);
        await context.SaveChangesAsync(cancellationToken);
    }
}

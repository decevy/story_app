namespace StoryApp.Core.Entities;

/// <summary>
/// How narrative flow continues after a passage segment or at a passage boundary (<see cref="Passage.SeamBefore"/>).
/// </summary>
public enum Seam
{
    Inline = 0,
    Paragraph = 1,
    Section = 2,
    MajorSection = 3,
    Chapter = 4
}

namespace CasaDoTerno.Application.Utils;

public static class FusoHorario
{
    private static readonly TimeZoneInfo Brasilia =
        TimeZoneInfo.FindSystemTimeZoneById("America/Sao_Paulo");

    public static DateTime AgoraBrasilia()
    {
        return TimeZoneInfo.ConvertTimeFromUtc(DateTime.UtcNow, Brasilia);
    }

    public static DateTime HojeBrasilia()
    {
        return AgoraBrasilia().Date;
    }
}
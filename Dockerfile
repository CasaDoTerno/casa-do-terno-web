FROM mcr.microsoft.com/dotnet/sdk:10.0 AS build
WORKDIR /src

COPY . .
RUN dotnet restore CasaDoTerno.API/CasaDoTerno.API.csproj
RUN dotnet publish CasaDoTerno.API/CasaDoTerno.API.csproj -c Release -o /app/publish

FROM mcr.microsoft.com/dotnet/aspnet:10.0 AS final
WORKDIR /app
COPY --from=build /app/publish .

ENV ASPNETCORE_URLS=http://+:10000
EXPOSE 10000

ENTRYPOINT ["dotnet", "CasaDoTerno.API.dll"]
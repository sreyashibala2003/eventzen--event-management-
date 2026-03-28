FROM mcr.microsoft.com/dotnet/sdk:10.0 AS build

WORKDIR /src

COPY ["Backend/services/booking-service/BookingService.csproj", "BookingService.csproj"]
RUN dotnet restore "BookingService.csproj"

COPY Backend/services/booking-service/ ./
RUN dotnet publish "BookingService.csproj" -c Release -o /app/publish /p:UseAppHost=false

FROM mcr.microsoft.com/dotnet/aspnet:10.0

WORKDIR /app

RUN apt-get update \
    && apt-get install -y --no-install-recommends fonts-dejavu-core \
    && rm -rf /var/lib/apt/lists/*

COPY --from=build /app/publish ./

EXPOSE 5050

ENTRYPOINT ["dotnet", "BookingService.dll"]

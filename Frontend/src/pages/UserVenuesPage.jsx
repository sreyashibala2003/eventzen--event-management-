import UserLayout from "../components/UserLayout";
import VenueList from "../components/VenueList";

function UserVenuesPage() {
  return (
    <UserLayout title="Explore Venues">
      <VenueList />
    </UserLayout>
  );
}

export default UserVenuesPage;

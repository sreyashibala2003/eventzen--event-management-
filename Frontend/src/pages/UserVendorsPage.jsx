import UserLayout from "../components/UserLayout";
import VendorList from "../components/VendorList";

function UserVendorsPage() {
  return (
    <UserLayout title="Explore Vendors">
      <VendorList />
    </UserLayout>
  );
}

export default UserVendorsPage;

import bcrypt, { hash } from "bcryptjs";
import dbConnect from "@/utils/dbConnect";
import { withUser } from "@/utils/auth";

export const PUT = withUser(async (req, user) => {
  try {
    await dbConnect();

    const { currentPassword, newPassword } = await req.json();

    if (!currentPassword || !newPassword) {
      return new Response(JSON.stringify({ message: "Missing required fields" }), { status: 400 });
    }

    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return new Response(JSON.stringify({ message: "Current password is incorrect" }), { status: 401 });
    }

    const hashedPassword = await hash(newPassword, 10);
    user.password = hashedPassword;
    await user.save();

    return new Response(JSON.stringify({ message: "Password updated successfully" }), { status: 200 });
  } catch (error) {
    console.error("Error updating password:", error);
    return new Response(JSON.stringify({ message: "Internal Server Error" }), { status: 500 });
  }
});

import dbConnect from '../../../../utils/dbConnect';
import Travel from '../../../../models/Travel';

export async function GET(request, { params }) {
  await dbConnect();
  const { id } = params;
  
  try {
    const travel = await Travel.findOne({ employee: id }).populate('employee');
    if (!travel) {
      return new Response(JSON.stringify({ message: 'No travel details found for this employee' }), { status: 404 });
    }
    return new Response(JSON.stringify({ travel }), { status: 200 });
  } catch (error) {
    return new Response(JSON.stringify({ message: 'Server error', error: error.message }), { status: 500 });
  }
}

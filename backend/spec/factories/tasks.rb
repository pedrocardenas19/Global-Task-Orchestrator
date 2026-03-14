FactoryBot.define do
  factory :task do
    title       { Faker::Lorem.unique.sentence(word_count: 3).chomp(".") }
    description { Faker::Lorem.paragraph }
    status      { "pending" }
  end
end
